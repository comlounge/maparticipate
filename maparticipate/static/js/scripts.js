(function() {
  var _base, _base1;

  if ((_base = String.prototype).startsWith == null) {
    _base.startsWith = function(s) {
      return this.slice(0, s.length) === s;
    };
  }

  if ((_base1 = String.prototype).endsWith == null) {
    _base1.endsWith = function(s) {
      return s === '' || this.slice(-s.length) === s;
    };
  }

  this.BaseMap = (function() {
    var elevation_popup, initial_bounds, mapdiv, point_grades;

    mapdiv = null;

    BaseMap.prototype.layers = {
      ziele: null,
      nullroute: null,
      defaultroutes: null,
      naturereserve: null,
      contestvariant: null,
      apew: null
    };

    BaseMap.prototype.elevation_marker_layer = null;

    elevation_popup = null;

    point_grades = [];

    BaseMap.prototype.draw_control = null;

    BaseMap.prototype.drawn_items = null;

    BaseMap.prototype.map_edit = null;

    initial_bounds = null;

    BaseMap.prototype.ziele_color = '#f0ad4e';

    BaseMap.prototype.psd_color = '#286090';

    BaseMap.prototype.routes_color = '#ef8a00';

    BaseMap.prototype.route_color = '#449d44';

    BaseMap.prototype.nullroute_color = '#c9302c';

    BaseMap.prototype.polyline = null;

    BaseMap.prototype.polyline_options = {
      weight: 7,
      opacity: 0.5,
      color: '#286090'
    };

    BaseMap.prototype.linear_distance = null;

    BaseMap.prototype.inc_dist = null;

    BaseMap.prototype.chart = null;

    BaseMap.prototype.transition_icon = L.divIcon({
      className: 'fa-icon',
      html: '<i class="fa fa-star fa-2x" style="color: #FFFC1E"></i>',
      iconSize: [22, 22]
    });

    BaseMap.prototype.popup_options = {
      autoPan: false,
      closeButton: false
    };

    function BaseMap(mapdiv, options) {
      this.mapdiv = mapdiv;
      if (options == null) {
        options = {};
      }
      this.init_map(options);
    }

    BaseMap.prototype.init_map = function(options) {
      var k, lat, long, map_id, mapmargin, mapoptions, resize, v;
      map_id = this.mapdiv.data("mapid");
      this.access_token = this.mapdiv.data("accesstoken");
      lat = 50.7281786 + (50.8679448 - 50.7581786) / 2;
      long = 6.0532093 + (6.11689568 - 6.0532093) / 2;
      mapoptions = {
        zoom: 12,
        center: [lat, long]
      };
      for (k in options) {
        v = options[k];
        mapoptions[k] = v;
      }
      resize = function() {
        if ($(window).width() >= 980) {
          return $(this.mapdiv).css("height", $(window).height() - mapmargin);
        } else {
          return $(this.mapdiv).css("height", $(window).height() - (mapmargin + 12));
        }
      };
      mapmargin = 80;
      $(this.mapdiv).css("height", $(window).height() - mapmargin);
      $(window).on("resize", resize);
      resize();
      L.mapbox.accessToken = this.access_token;
      this.map = L.mapbox.map(this.mapdiv.attr('id'), map_id, mapoptions);
      this.initial_bounds = this.map.getBounds();
      $('.togglelayer').click((function(_this) {
        return function(e) {
          var layer;
          $(e.target).toggleClass('btn-default btn-success');
          layer = _this.layers[$(e.target).data('layer')];
          if (_this.map.hasLayer(layer)) {
            return _this.map.removeLayer(layer);
          } else {
            return _this.map.addLayer(layer);
          }
        };
      })(this));
      $('#reset_map').click((function(_this) {
        return function() {
          return _this.map.fitBounds(_this.initial_bounds);
        };
      })(this));
      return this.elevation_popup = L.popup(this.popup_options).setLatLng([0, 0]);
    };

    BaseMap.prototype.init_draw_feature = function() {
      this.drawn_items = new L.featureGroup().addTo(this.map);
      this.draw_control = new L.Control.Draw({
        edit: {
          featureGroup: this.drawn_items,
          remove: false
        },
        draw: {
          polygon: false,
          polyline: true,
          rectangle: false,
          circle: false,
          marker: false
        }
      });
      this.map.on('draw:created', function(e) {
        return this.drawn_items.addLayer(e.layer);
      });
      return this.map_edit = new L.EditToolbar.Edit(this.map, {
        featureGroup: this.draw_control.options.edit.featureGroup,
        selectedPathOptions: this.draw_control.options.edit.selectedPathOptions
      });
    };

    BaseMap.prototype.setup_segment = function(segment) {
      var end, p, start;
      this.map.fitBounds(segment.boundingbox);
      this.initial_bounds = segment.boundingbox;
      start = L.marker(segment.start, {
        icon: this.transition_icon
      }).addTo(this.map);
      start.bindPopup("Übergangspunkt - Start", this.popup_options);
      p = null;
      start.on('mouseover', (function(_this) {
        return function(e) {
          return p = _this.open_popup_as_layer(e.target);
        };
      })(this));
      start.on('mouseout', (function(_this) {
        return function(e) {
          return _this.map.removeLayer(p);
        };
      })(this));
      end = L.marker(segment.end, {
        icon: this.transition_icon
      }).addTo(this.map);
      end.bindPopup("Übergangspunkt - Ende", {
        autoPan: false,
        closeButton: false
      });
      end.on('mouseover', (function(_this) {
        return function(e) {
          return p = _this.open_popup_as_layer(e.target);
        };
      })(this));
      return end.on('mouseout', (function(_this) {
        return function(e) {
          return _this.map.removeLayer(p);
        };
      })(this));
    };

    BaseMap.prototype.setup_line_details = function(segment) {
      var convert, swap;
      this.linear_distance = this.get_distance(this.get_linestring([segment.start, segment.end], convert = false, swap = true));
      $('#linear-distance').html(this.get_readable_distance(this.linear_distance));
      return this.elevation_marker_layer = L.mapbox.featureLayer().addTo(this.map);
    };

    BaseMap.prototype.add_polyline = function(points) {
      this.polyline = new L.polyline(points, this.polyline_options).addTo(this.map);
      if (this.drawn_items !== null) {
        return this.drawn_items.addLayer(this.polyline);
      }
    };

    BaseMap.prototype.clear_polyline = function() {
      if (this.polyline !== null) {
        return this.map.removeLayer(this.polyline);
      }
    };

    BaseMap.prototype.update_polyline_info = function() {
      var d, f;
      if (this.polyline !== null) {
        d = this.get_distance(this.get_linestring(this.polyline.getLatLngs()));
        f = (d / this.linear_distance).toFixed(2);
        $('#current-distance').html(this.get_readable_distance(d));
        return $('#distance-factor').html(f);
      }
    };

    BaseMap.prototype.update_elevation_data = function() {
      var distance, i, line, new_sample_route, points_string, sample_quant, url, _i;
      line = this.get_linestring(this.polyline.getLatLngs());
      distance = turf.lineDistance(line, 'kilometers') * 1000;
      sample_quant = Math.min(distance / 50, 220);
      this.inc_dist = distance / sample_quant;
      new_sample_route = [];
      for (i = _i = 0; _i < sample_quant; i = _i += 1) {
        new_sample_route.push(turf.along(line, this.inc_dist * i * 0.001, 'kilometers')['geometry']['coordinates']);
      }
      url = "https://api.tiles.mapbox.com/v4/surface/mapbox.mapbox-terrain-v2.json?layer=contour&fields=ele,index&access_token=" + this.access_token + "&interpolate=true&geojson=true&points=";
      points_string = $.map(new_sample_route, function(p) {
        return p[0] + "," + p[1];
      }).join(";");
      return $.get(url + points_string, (function(_this) {
        return function(data) {
          return _this.create_barchart(data.results.features);
        };
      })(this));
    };

    BaseMap.prototype.create_barchart = function(data) {
      var chart_data, ctx, options;
      Chart.defaults.global.showScale = false;
      Chart.defaults.global.scaleShowLabels = false;
      Chart.defaults.global.scaleBeginAtZero = true;
      Chart.defaults.global.responsive = true;
      Chart.defaults.global.maintainAspectRatio = true;
      Chart.defaults.global.animation = false;
      Chart.defaults.global.tooltipTemplate = "<%= value %> m";
      options = {
        scaleShowGridLines: false,
        barShowStroke: false,
        barStrokeWidth: 0,
        barValueSpacing: 0,
        barDatasetSpacing: 0
      };
      chart_data = {
        labels: $.map(data, function(d) {
          return '';
        }),
        datasets: [
          {
            fillColor: "rgba(220,220,220,0.8)",
            data: $.map(data, function(f) {
              return [f.properties.ele];
            })
          }
        ]
      };
      ctx = $("#elevation").get(0).getContext("2d");
      ctx.canvas.height = 150;
      if (this.chart !== null) {
        this.chart.destroy();
      }
      this.point_grades = [];
      this.chart = new Chart(ctx).Bar(chart_data, options);
      $.each(data, (function(_this) {
        return function(i, n) {
          var curr, g, next, point_grade, prev;
          point_grade = '';
          prev = i > 0 ? data[i - 1].properties.ele : n.properties.ele;
          next = i < data.length - 1 ? data[i + 1].properties.ele : n.properties.ele;
          curr = n.properties.ele;
          point_grade = (0.5 * ((curr - prev) + (next - curr)) / (2 * _this.inc_dist)).toFixed(2);
          g = Math.abs(point_grade);
          _this.point_grades.push(g);
          if (g > 0.05) {
            return _this.chart.datasets[0].bars[i].fillColor = "rgba(201,48,44,0.8)";
          } else if (g > 0.03) {
            return _this.chart.datasets[0].bars[i].fillColor = "rgba(240,173,78,0.8)";
          } else if (g >= 0) {
            return _this.chart.datasets[0].bars[i].fillColor = "rgba(68,157,68,0.8)";
          }
        };
      })(this));
      this.chart.update();
      ctx.canvas.onmousemove = (function(_this) {
        return function(e) {
          var active_bars, elem, idx, marker_line;
          active_bars = _this.chart.getBarsAtEvent(e);
          if (active_bars.length > 0) {
            elem = active_bars[0];
            idx = _this.chart.datasets[0].bars.indexOf(elem);
            if (idx === 0) {
              marker_line = [data[idx], data[idx + 1]];
            } else if (idx === data.length - 1) {
              marker_line = [data[idx - 1], data[idx]];
            } else {
              marker_line = [data[idx - 1], data[idx], data[idx + 1]];
            }
            _this.set_elevation_marker(marker_line, elem._saved.fillColor);
            return _this.elevation_popup.setContent("Höhe: " + elem.value + " m<br />Steigung: " + _this.point_grades[idx] * 100 + "%").setLatLng(_this.geojson_to_latlng(data[idx])).update();
          }
        };
      })(this);
      ctx.canvas.onmouseover = (function(_this) {
        return function(e) {
          _this.map.addLayer(_this.elevation_popup);
          return _this.polyline.setStyle({
            opacity: 0.25
          });
        };
      })(this);
      return ctx.canvas.onmouseout = (function(_this) {
        return function(e) {
          _this.set_elevation_marker([]);
          _this.map.removeLayer(_this.elevation_popup);
          return _this.polyline.setStyle(_this.polyline_options);
        };
      })(this);
    };

    BaseMap.prototype.set_elevation_marker = function(points, color) {
      var marker_line, points_array;
      if (color == null) {
        color = null;
      }
      points_array = $.map(points, function(p) {
        return [p ? p.geometry.coordinates : void 0];
      });
      marker_line = turf.linestring(points_array);
      this.elevation_marker_layer.setGeoJSON(marker_line);
      return this.elevation_marker_layer.on('layeradd', function(e) {
        var l;
        l = e.layer;
        return l.setStyle({
          color: color,
          opacity: 1,
          weight: 7
        });
      });
    };

    BaseMap.prototype.get_linestring = function(points, convert, swap) {
      var points_array;
      if (convert == null) {
        convert = true;
      }
      if (swap == null) {
        swap = false;
      }
      if (convert) {
        points_array = $.map(points, function(p) {
          return [[p.lng, p.lat]];
        });
      } else {
        points_array = points;
      }
      if (swap) {
        points_array = $.map(points_array, function(p) {
          return [[p[1], p[0]]];
        });
      }
      return turf.linestring(points_array);
    };

    BaseMap.prototype.get_distance = function(line) {
      var d;
      return d = turf.lineDistance(line, 'kilometers') * 1000;
    };

    BaseMap.prototype.get_readable_distance = function(d) {
      return L.GeometryUtil.readableDistance(d, true);
    };

    BaseMap.prototype.geojson_to_latlng = function(geojson) {
      return {
        'lat': geojson.geometry.coordinates[1],
        'lng': geojson.geometry.coordinates[0]
      };
    };

    BaseMap.prototype.open_popup_as_layer = function(item) {
      var p;
      p = item.getPopup();
      p.setLatLng(item.getLatLng());
      this.map.addLayer(p);
      return p;
    };

    return BaseMap;

  })();

}).call(this);

(function() {


}).call(this);

(function() {
  $(document).ready(function() {
    if ($(".parsley-validate").length) {
      return $(".parsley-validate").parsley({
        excluded: "input[type=file]",
        errorsWrapper: "<span class='errors-block help-block'></span>",
        errorsContainer: function(el) {
          return el.$element.closest("div");
        }
      });
    }
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.MapComments = (function() {
    MapComments.prototype.basemap = null;

    MapComments.prototype.mode = 'view';

    MapComments.prototype.events = null;

    MapComments.prototype.popup_view_templates = {
      comment: "{{comment}}\n{{#author}}\n    <div class=\"text-muted\">\n        <small>\n        von {{author_name}}\n        <br />\n        {{updated_string}}\n        </small>\n    </div>\n{{/author}}",
      bruecke: "<div class=\"text-center\"><b>Brücke</b></div>\n{{#comment}}\n    {{comment}}\n{{/comment}}",
      tunnel: "<div class=\"text-center\"><b>Unterführung</b></div>\n{{#comment}}\n    {{comment}}\n{{/comment}}"
    };

    MapComments.prototype.comment_form = "<textarea name='comment' class='form-control' id='map-comment-input' rows='4' required>{{comment}}</textarea>\n<button class=\"btn btn-xs btn-default\" id=\"ok_mapcomment\">ok</button>\n<div class='pull-right'>\n\n    <!--input type='submit' class='btn btn-primary btn-xs' value='speichern'-->\n    {{#create}}\n        <button class='btn btn-default btn-xs' id='cancel_mapcomment'>\n            abbrechen\n        </button>\n    {{/create}}\n    {{^create}}\n        <button class='btn btn-danger btn-xs' id='delete_mapcomment'>\n            <i class='fa fa-trash'></i>\n        </button>\n    {{/create}}\n</div>\n<div class='clearfix'></div>";

    MapComments.prototype.admin_comment_form = "{{comment}}\n{{#author}}\n    <div class=\"text-muted\">\n        <small>\n        von {{author_name}}\n        <br />\n        {{updated_string}}\n        </small>\n    </div>\n{{/author}}\n<div class='pull-right'>\n    <button class='btn btn-danger btn-xs' id='delete_mapcomment'>\n        <i class='fa fa-trash'></i>\n    </button>\n</div>\n<div class='clearfix'></div>";

    MapComments.prototype.global_comment_form = "<textarea name='comment' class='form-control' id='map-comment-input' rows='4' required>{{comment}}</textarea>\n<button class=\"btn btn-xs btn-primary\" id=\"ok_mapcomment\">speichern</button>\n<div class='pull-right'>\n\n    <!--input type='submit' class='btn btn-primary btn-xs' value='speichern'-->\n    {{#create}}\n        <button class='btn btn-default btn-xs' id='cancel_mapcomment'>\n            abbrechen\n        </button>\n    {{/create}}\n    {{^create}}\n        <button class='btn btn-danger btn-xs' id='delete_mapcomment'>\n            <i class='fa fa-trash'></i>\n        </button>\n    {{/create}}\n</div>\n<div class='clearfix'></div>";

    MapComments.prototype.mapcomments = {};

    MapComments.prototype.current_mapcomment = null;

    MapComments.prototype.current_mapcomment_marker = null;

    MapComments.prototype.mapcomment_dict = {
      comment: null,
      location: null,
      type: null,
      create: true
    };

    MapComments.prototype.map_comments_layer = new L.LayerGroup();

    MapComments.prototype.add_icon = null;

    MapComments.prototype.icon_template = "<span class='fa-stack fa-lg'>\n<i class='fa fa-circle fa-stack-2x' style='color:#142862;'></i>\n<i class='fa fa-{{type}} fa-stack-1x fa-inverse'></i>\n</span>";

    MapComments.prototype.icons = {
      tunnel: L.icon({
        iconUrl: "/static/img/tunnel.png",
        iconSize: [50, 50]
      }),
      bruecke: L.icon({
        iconUrl: "/static/img/bruecke.png",
        iconSize: [50, 50]
      }),
      comment: L.divIcon({
        className: 'fa-icon',
        html: "<span class='fa-stack fa-lg'>\n<i class='fa fa-circle fa-stack-2x'></i>\n<i class='fa fa-comment fa-stack-1x fa-inverse'></i>\n</span>",
        iconSize: [22, 22],
        popupAnchor: [6, 0]
      })
    };

    function MapComments(basemap) {
      this.basemap = basemap;
      this.clear_markers = __bind(this.clear_markers, this);
      this.to_list = __bind(this.to_list, this);
      this.save_current_mapcomment = __bind(this.save_current_mapcomment, this);
      this.remove_current_marker = __bind(this.remove_current_marker, this);
      this.delete_comment_marker = __bind(this.delete_comment_marker, this);
      this.cancel_new_comment_marker = __bind(this.cancel_new_comment_marker, this);
      this.close_current_marker = __bind(this.close_current_marker, this);
      this.add_new_comment_marker = __bind(this.add_new_comment_marker, this);
      this.map_comments_layer.addTo(this.basemap.map);
      this.basemap.mapdiv.on('keyup', '#map-comment-input', (function(_this) {
        return function(e) {
          return _this.save_current_mapcomment(e.target.value);
        };
      })(this));
      this.events = {
        changed: null
      };
    }

    MapComments.prototype.on = function(evt_name, cb) {
      return this.events[evt_name] = cb;
    };

    MapComments.prototype.trigger = function(evt_name) {
      if (this.events[evt_name] !== null) {
        return this.events[evt_name]();
      }
    };

    MapComments.prototype.load_mapcomments = function(popup_template) {
      if (popup_template == null) {
        popup_template = this.comment_view;
      }
      return $.ajax({
        url: this.basemap.mapdiv.data('mapcomment_url'),
        method: 'GET',
        dataType: "json",
        success: (function(_this) {
          return function(data, textStatus, jqXHR) {
            var c, m, _i, _len, _ref;
            _ref = data['comments'];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              c = _ref[_i];
              m = _this.create_marker(c.location, c.type);
              if (_this.mode === 'view') {
                popup_template = _this.popup_view_templates[c.type];
              }
              m.getPopup().setContent(Mustache.render(popup_template, c)).update();
              _this.mapcomments[m._leaflet_id] = c;
            }
            if (data['edit'] != null) {
              return _this.mode = 'edit';
            }
          };
        })(this)
      });
    };

    MapComments.prototype.load_mapcomments_for_view = function() {
      this.mode = 'view';
      return this.load_mapcomments(this.comment_view);
    };

    MapComments.prototype.load_mapcomments_for_edit = function() {
      this.mode = 'edit';
      return this.load_mapcomments(this.comment_form);
    };

    MapComments.prototype.create_marker = function(loc, type) {
      var icon, marker;
      icon = this.icons[type];
      marker = new L.Marker(loc, {
        draggable: this.mode === 'edit',
        icon: icon
      });
      this.map_comments_layer.addLayer(marker);
      if (this.mode === 'view') {
        marker.bindPopup(Mustache.render(this.comment_view), this.basemap.popup_options);
        marker.on('mouseover', function(e) {
          return marker.openPopup();
        });
        marker.on('mouseout', function(e) {
          return marker.closePopup();
        });
      } else {
        marker.bindPopup(Mustache.render(this.comment_form, {
          create: true
        }), {
          closeButton: false
        });
        marker.on('dragstart', (function(_this) {
          return function(e) {
            return e.target.closePopup();
          };
        })(this));
        marker.on('dragend', (function(_this) {
          return function(e) {
            e.target.getPopup().setContent(Mustache.render(_this.comment_form, _this.mapcomments[e.target._leaflet_id])).update();
            e.target.openPopup();
            return _this.save_current_mapcomment();
          };
        })(this));
        marker.on('popupopen', (function(_this) {
          return function(e) {
            _this.current_mapcomment_marker = e.target;
            if (_this.basemap.map_edit != null) {
              return _this.basemap.map_edit.disable();
            }
          };
        })(this));
        marker.on('popupclose', (function(_this) {
          return function(e) {
            if (_this.basemap.map_edit != null) {
              _this.basemap.map_edit.enable();
            }
            return _this.current_mapcomment_marker = null;
          };
        })(this));
      }
      return marker;
    };

    MapComments.prototype.add_new_comment_marker = function(e) {
      var center, m, _ref;
      center = this.basemap.map.getCenter();
      this.add_icon = $(e.target).data('icon');
      m = this.create_marker([center.lat, center.lng], this.add_icon);
      m.openPopup();
      if ((_ref = this.add_icon) === 'bruecke' || _ref === 'tunnel') {
        return this.save_current_mapcomment();
      }
    };

    MapComments.prototype.close_current_marker = function() {
      this.current_mapcomment_marker = null;
      return this.basemap.map.closePopup();
    };

    MapComments.prototype.cancel_new_comment_marker = function() {
      return this.remove_current_marker();
    };

    MapComments.prototype.delete_comment_marker = function() {
      var current;
      current = this.mapcomments[this.current_mapcomment_marker._leaflet_id];
      this.remove_current_marker();
      if (!current.type === 'comment' || (current.comment != null)) {
        return this.trigger('changed');
      }
    };

    MapComments.prototype.remove_current_marker = function() {
      delete this.mapcomments[this.current_mapcomment_marker._leaflet_id];
      this.map_comments_layer.removeLayer(this.current_mapcomment_marker);
      this.current_mapcomment_marker = null;
      return this.basemap.map.closePopup();
    };

    MapComments.prototype.save_current_mapcomment = function(comment) {
      var current, current_marker_id, loc;
      if (comment == null) {
        comment = null;
      }
      current_marker_id = this.current_mapcomment_marker._leaflet_id;
      if (!(current_marker_id in this.mapcomments)) {
        this.mapcomments[current_marker_id] = $.extend(true, {}, this.mapcomment_dict);
      }
      current = this.mapcomments[current_marker_id];
      if (comment) {
        current.comment = comment;
      }
      loc = this.current_mapcomment_marker.getLatLng();
      current.location = [loc.lat, loc.lng];
      current.create = false;
      if (this.add_icon) {
        current.type = this.add_icon;
        this.add_icon = null;
      }
      this.current_mapcomment_marker.bindPopup(Mustache.render(this.comment_form, current), this.basemap.popup_options);
      if (current.type !== 'comment' || (current.comment != null)) {
        return this.trigger('changed');
      }
    };

    MapComments.prototype.to_list = function() {
      return $.map(this.mapcomments, function(c) {
        return c;
      });
    };

    MapComments.prototype.clear_markers = function() {
      this.mapcomments = {};
      this.basemap.map.removeLayer(this.map_comments_layer);
      this.map_comments_layer = new L.LayerGroup();
      return this.basemap.map.addLayer(this.map_comments_layer);
    };

    return MapComments;

  })();

}).call(this);

(function() {
  $.fn.segments = function(opts) {
    var basemap, bbox, end, init, line, map, setup_segment, start;
    if (opts == null) {
      opts = {};
    }
    basemap = null;
    map = null;
    bbox = null;
    start = null;
    end = null;
    line = null;
    init = function() {
      var mapdiv, options, s, with_layers, _i, _len, _ref;
      mapdiv = $('#overview-map');
      options = {
        zoomControl: false,
        scrollWheelZoom: false,
        touchZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false
      };
      basemap = new window.BaseMap(mapdiv, options, with_layers = false);
      _ref = $('li.segment');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        setup_segment($(s).data('segment'));
      }
      $('li.segment').hover(function() {
        $(this).addClass('bg-info');
        return bbox = L.rectangle($(this).data('segment').boundingbox, {
          color: "#ff7800",
          weight: 1
        }).addTo(basemap.map);
      }, function() {
        $(this).removeClass('bg-info');
        return basemap.map.removeLayer(bbox);
      });
      return $('li.segment').click(function() {
        return window.open($(this).data('url'), '_self');
      });
    };
    setup_segment = function(segment) {
      start = L.marker(segment.start, {
        icon: basemap.transition_icon
      }).addTo(basemap.map);
      end = L.marker(segment.end, {
        icon: basemap.transition_icon
      }).addTo(basemap.map);
      return basemap.add_polyline([segment.start, segment.end]);
    };
    $(this).each(init);
    return this;
  };

  $.fn.comments = function(opts) {
    var basemap, comments, init, is_admin, save_mapcomments, setup_map_comments;
    if (opts == null) {
      opts = {};
    }
    basemap = null;
    comments = null;
    is_admin = false;
    init = function() {
      var options;
      options = {
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false
      };
      basemap = new window.BaseMap($(this));
      comments = new window.MapComments(basemap);
      if (basemap.mapdiv.data('isadmin') === 'True') {
        is_admin = true;
      }
      setup_map_comments();
      $('.add_mapcomment').click(comments.add_new_comment_marker);
      basemap.mapdiv.on('click', '#cancel_mapcomment', comments.cancel_new_comment_marker);
      basemap.mapdiv.on('click', '#delete_mapcomment', function(e) {
        if (confirm('Soll der Kommentar wirklich gelöscht werden?')) {
          comments.delete_comment_marker();
          return save_mapcomments();
        } else {
          return comments.close_current_marker();
        }
      });
      return basemap.mapdiv.on('click', '#ok_mapcomment', function(e) {
        var current;
        current = comments.mapcomments[comments.current_mapcomment_marker._leaflet_id];
        if ((current == null) || (current.comment == null)) {
          return comments.cancel_new_comment_marker();
        } else {
          comments.save_current_mapcomment();
          comments.close_current_marker();
          return save_mapcomments();
        }
      });
    };
    setup_map_comments = function() {
      if (is_admin) {
        comments.comment_form = comments.admin_comment_form;
        return comments.load_mapcomments_for_edit();
      } else {
        comments.comment_form = comments.global_comment_form;
        return comments.load_mapcomments_for_view();
      }
    };
    save_mapcomments = function() {
      return $.ajax({
        url: document.URL,
        method: 'POST',
        data: {
          mapcomments: JSON.stringify(comments.to_list())
        },
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
          if (data.status === 'OK') {
            basemap.map.closePopup();
            comments.clear_markers();
            return setup_map_comments();
          }
        }
      });
    };
    $(this).each(init);
    return this;
  };

  $(document).ready(function() {
    $('#overview-list').segments();
    return $('#comments-overview-map').comments();
  });

}).call(this);

(function() {
  $.fn.segment = function(opts) {
    var init;
    if (opts == null) {
      opts = {};
    }
    init = function() {
      var basemap;
      basemap = new window.BaseMap($(this));
      basemap.setup_segment($(this).data("segment"));
      $('.proposal-item').hover(function() {
        $(this).addClass('bg-info');
        return basemap.add_polyline($(this).data('route'));
      }, function() {
        $(this).removeClass('bg-info');
        return basemap.clear_polyline();
      });
      return $('.proposal-item').click(function() {
        return window.open($(this).data('url'), '_self');
      });
    };
    $(this).each(init);
    return this;
  };

  $.fn.proposal_view = function(opts) {
    var basemap, clear_marker, comment_marker, init, marker_icon_class, set_comment_marker;
    if (opts == null) {
      opts = {};
    }
    basemap = null;
    comment_marker = null;
    marker_icon_class = null;
    init = function() {
      var mapcomments, segment, with_update;
      segment = $(this).data("segment");
      basemap = new window.BaseMap($(this));
      basemap.setup_segment(segment);
      basemap.setup_line_details(segment);
      basemap.add_polyline($(this).data("route"), with_update = true);
      basemap.update_polyline_info();
      basemap.update_elevation_data();
      mapcomments = new window.MapComments(basemap);
      mapcomments.load_mapcomments();
      $('#comment_button').click(function() {
        $('#comment_block').show();
        return $(this).hide();
      });
      $('#comment_cancel').click(function(e) {
        e.preventDefault();
        clear_marker();
        $('.comment_marker').removeClass('active');
        $('#comment_block').hide();
        return $('#comment_button').show();
      });
      return $('.comment_marker').click(function() {
        marker_icon_class = $(this).find('i').attr('class');
        if ($(this).hasClass('active')) {
          $(this).removeClass('active');
          return basemap.map.off('click', set_comment_marker);
        } else {
          $('.comment_marker').removeClass('active');
          $(this).addClass('active');
          return basemap.map.on('click', set_comment_marker);
        }
      });
    };
    clear_marker = function() {
      if (comment_marker !== null) {
        return basemap.map.removeLayer(comment_marker);
      }
    };
    set_comment_marker = function(e) {
      var loc_string;
      clear_marker();
      comment_marker = new L.marker(e.latlng, {
        draggable: 'true',
        icon: L.divIcon({
          className: marker_icon_class + ' fa-2x'
        })
      });
      basemap.map.addLayer(comment_marker);
      loc_string = JSON.stringify([e.latlng.lat, e.latlng.lng]);
      $('form#add_comment_form input[name=location]').val(loc_string);
      return $('form#add_comment_form input[name=icon]').val(marker_icon_class);
    };
    $(this).each(init);
    return this;
  };

  $.fn.proposal_edit = function(opts) {
    var basemap, cancel_button, comments, init, initial_route, is_create, lock_save_button, mapdiv, publish_button, route_coords, save_button, save_url, saved, setup_map, setup_map_comments, show_edit_tooltip, unlock_save_button;
    if (opts == null) {
      opts = {};
    }
    mapdiv = basemap = null;
    comments = null;
    show_edit_tooltip = false;
    saved = false;
    save_button = null;
    cancel_button = null;
    publish_button = null;
    initial_route = null;
    route_coords = null;
    is_create = false;
    save_url = null;
    init = function() {
      setup_map($(this));
      setup_map_comments();
      is_create = $(this).data('is_create');
      save_button = $('#save-proposal-form-button');
      cancel_button = $('#cancel-proposal-form-button');
      publish_button = $('#publish-proposal-form-button');
      $('#save-proposal-form').submit(function(e) {
        var data;
        e.preventDefault();
        basemap.update_elevation_data();
        data = {};
        $.each($(this).serializeArray(), function(i, input) {
          return data[input.name] = input.value;
        });
        data.route = JSON.stringify(route_coords);
        data.mapcomments = JSON.stringify(comments.to_list());
        if (save_url == null) {
          if (is_create) {
            save_url = $(this).data('create_url');
          } else {
            save_url = $(this).attr('action');
          }
        }
        return $.ajax({
          url: save_url,
          method: 'POST',
          data: data,
          dataType: "json",
          success: function(data, textStatus, jqXHR) {
            if (data.status === 'OK') {
              lock_save_button();
              basemap.map.closePopup();
              initial_route = route_coords;
              save_url = data.edit_url;
              if (is_create) {
                return window.location.href = data.edit_url;
              }
            }
          }
        });
      });
      $('textarea#route_description').on('keyup', function() {
        return unlock_save_button();
      });
      if (show_edit_tooltip) {
        $('.leaflet-editing-icon:last').tooltip({
          title: $("body").data("i18n-draghere"),
          trigger: 'manual'
        }).tooltip('show');
        $('.leaflet-editing-icon').on('mousedown', function() {
          return $(this).tooltip('destroy');
        });
      }
      return save_button.attr('disabled', 'disabled');
    };
    setup_map = function(mapdiv) {
      var segment, with_draw;
      basemap = new window.BaseMap(mapdiv, with_draw = true);
      basemap.init_draw_feature();
      segment = mapdiv.data("segment");
      basemap.setup_segment(segment);
      basemap.setup_line_details(segment);
      initial_route = mapdiv.data("route");
      if (!initial_route) {
        show_edit_tooltip = true;
        initial_route = [segment.start, segment.end];
      }
      basemap.add_polyline(initial_route);
      basemap.update_polyline_info();
      basemap.update_elevation_data();
      basemap.map_edit.enable();
      basemap.map.on('mousemove', function(e) {
        basemap.update_polyline_info();
        route_coords = $.map(basemap.polyline.getLatLngs(), function(p) {
          return [[p.lat, p.lng]];
        });
        if (route_coords.toString() !== initial_route.toString()) {
          return unlock_save_button();
        }
      });
      return $('#update_elevation_chart').show().click(function() {
        return basemap.update_elevation_data();
      });
    };
    setup_map_comments = function() {
      comments = new window.MapComments(basemap);
      comments.load_mapcomments_for_edit();
      comments.on('changed', function() {
        return unlock_save_button();
      });
      $('.add_mapcomment').click(comments.add_new_comment_marker);
      basemap.mapdiv.on('click', '#cancel_mapcomment', comments.cancel_new_comment_marker);
      basemap.mapdiv.on('click', '#delete_mapcomment', comments.delete_comment_marker);
      return basemap.mapdiv.on('click', '#ok_mapcomment', comments.close_current_marker);
    };
    lock_save_button = function() {
      save_button.attr('disabled', 'disabled');
      save_button.html('<i class="fa fa-check"></i> gespeichert');
      cancel_button.hide();
      publish_button.show();
      return $(window).unbind('beforeunload');
    };
    unlock_save_button = function() {
      save_button.show();
      save_button.attr('disabled', null);
      save_button.html('speichern');
      cancel_button.show();
      publish_button.hide();
      return $(window).bind('beforeunload', function() {
        return 'Ihre Änderungen sind noch nicht gespeichert.';
      });
    };
    $(this).each(init);
    return this;
  };

  $.fn.own_overview = function(opts) {
    var init;
    if (opts == null) {
      opts = {};
    }
    init = function() {
      var basemap;
      basemap = new window.BaseMap($(this));
      $('.proposal-item').hover(function() {
        $(this).addClass('bg-info');
        return basemap.add_polyline($(this).data('route'));
      }, function() {
        $(this).removeClass('bg-info');
        return basemap.clear_polyline();
      });
      return $('.proposal-item').click(function() {
        return window.open($(this).data('url'), '_self');
      });
    };
    $(this).each(init);
    return this;
  };

  $(document).ready(function() {
    $('#segment-map').segment();
    $('#proposal-view-map').proposal_view();
    $('#proposal-edit-map').proposal_edit();
    return $('#own-overview-map').own_overview();
  });

}).call(this);
