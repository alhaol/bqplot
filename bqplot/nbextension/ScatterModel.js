/* Copyright 2015 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(["./d3", "./MarkModel"], function(d3, MarkModelModule) {
    "use strict";

    var ScatterModel = MarkModelModule.MarkModel.extend({
        initialize: function() {
            // TODO: Normally, color, opacity and size should not require a redraw
            ScatterModel.__super__.initialize.apply(this);
            this.on_some_change(["x", "y", "color", "opacity", "size"], this.update_data, this);
            this.on_some_change(["names", "names_unique"], function() { this.update_unique_ids(); this.trigger("data_updated"); }, this);
            // FIXME: replace this with on("change:preserve_domain"). It is not done here because
            // on_some_change depends on the GLOBAL backbone on("change") handler which
            // is called AFTER the specific handlers on("change:foobar") and we make that
            // assumption.
            this.on_some_change(["preserve_domain"], this.update_domains, this);
            this.on("change:default_size", this.update_bounding_box, this);
        },
        update_bounding_box: function(model, value) {
            this.x_padding = this.y_padding = Math.sqrt(this.get("default_size")) / 2 + 1;
            this.trigger("mark_padding_updated");
        },
        update_data: function() {
            this.dirty = true;
            var x_data = this.get_typed_field("x");
            var scales = this.get("scales");
            var x_scale = scales["x"];
            var y_scale = scales["y"];
            var color_scale = scales["color"];
            var opacity_scale = scales["opacity"];
            var size_scale = scales["size"];
            var y_data = this.get_typed_field("y");

            if (x_data.length === 0 || y_data.length === 0) {
                this.mark_data = [];
            }
            else {
                //FIXME:Temporary fix to avoid misleading NaN error due to X and Y
                //being of different lengths. In particular, if Y is of a smaller
                //length, throws an error on the JS side
                var min_len = Math.min(x_data.length, y_data.length);
                x_data = x_data.slice(0, min_len);
                var color = this.get_typed_field("color");
                var size = this.get_typed_field("size");
                var opacity = this.get_typed_field("opacity");

                if(color_scale) {
                    if(!this.get("preserve_domain")["color"]) {
                        color_scale.compute_and_set_domain(color, this.id);
                    } else {
                        color_scale.del_domain([], this.id);
                    }
                }

                this.mark_data = x_data.map(function(d, i) {
                    return {x: d,
                            y: y_data[i],
                            z: color[i],
                            size: size[i],
                            opacity: opacity[i],
                            };
                });
            }
            this.update_unique_ids();
            this.update_domains();
            this.dirty = false;
            this.trigger("data_updated");
        },
        update_unique_ids: function() {
            var names = this.get_typed_field("names");
            var show_labels = (names.length !== 0);
            names = (show_labels) ? names : this.mark_data.map(function(data, index) {
                return "Dot" + index;
            });
            var unique_ids = [];
            if(this.get("names_unique")) {
                unique_ids = names.slice(0);
            } else {
                unique_ids = _.range(this.mark_data.length);
            }

            this.mark_data.forEach(function(data, index){
                                       data["name"] = names[index];
                                       data["unique_id"] = unique_ids[index];
            });
        },
        update_domains: function() {
            if (!this.mark_data) {
                return;
            }
            // color scale needs an issue in DateScaleModel to be fixed. It
            // should be moved here as soon as that is fixed.

            var scales = this.get("scales");
            var x_scale = scales["x"];
            var y_scale = scales["y"];
            var size_scale = scales["size"];
            var opacity_scale = scales["opacity"];

            if(!this.get("preserve_domain")["x"]) {
                x_scale.compute_and_set_domain(this.mark_data.map(function(elem) {
                    return elem.x;
                }), this.id);
            } else {
                x_scale.del_domain([], this.id);
            }
            if(!this.get("preserve_domain")["y"]) {
                y_scale.compute_and_set_domain(this.mark_data.map(function(elem) {
                    return elem.y;
                }), this.id);
            } else {
                y_scale.del_domain([], this.id);
            }
            if(size_scale) {
                if(!this.get("preserve_domain")["size"]) {
                    size_scale.compute_and_set_domain(this.mark_data.map(function(elem) {
                        return elem.size;
                    }), this.id);
                } else {
                    size_scale.del_domain([], this.id);
                }
            }
            if(opacity_scale) {
                if(!this.get("preserve_domain")["opacity"]) {
                    opacity_scale.compute_and_set_domain(this.mark_data.map(function(elem) {
                        return elem.opacity;
                    }), this.id);
                } else {
                    opacity_scale.del_domain([], this.id);
                }
            }
        },
    });

    return {
        ScatterModel: ScatterModel,
    };
});
