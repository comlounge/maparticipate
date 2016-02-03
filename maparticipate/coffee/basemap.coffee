
String::startsWith ?= (s) -> @slice(0, s.length) == s
String::endsWith   ?= (s) -> s == '' or @slice(-s.length) == s

class @BaseMap

    mapdiv = null

    layers:
        ziele: null
        #psd: null
        nullroute: null
        #route: null
        defaultroutes: null
        naturereserve: null
        contestvariant: null
        apew: null

    elevation_marker_layer: null
    elevation_popup = null
    point_grades = []

    draw_control: null
    drawn_items: null
    map_edit: null
    initial_bounds = null

    ziele_color: '#f0ad4e'
    psd_color: '#286090'
    routes_color: '#ef8a00'
    route_color: '#449d44'
    nullroute_color: '#c9302c'

    polyline: null
    polyline_options:
        weight: 7
        opacity: 0.5
        color: '#286090'

    linear_distance: null
    inc_dist: null
    chart: null

    transition_icon: L.divIcon(
        className: 'fa-icon'
        html: '<i class="fa fa-star fa-2x" style="color: #FFFC1E"></i>'
        iconSize: [22,22]
    )

    popup_options:
        autoPan: false
        closeButton: false
        #minWidth: 110



    constructor: (@mapdiv, options={}) ->
        @init_map(options)

    init_map: (options) ->
        map_id = @mapdiv.data("mapid")
        @access_token = @mapdiv.data("accesstoken")
        # set center
        lat = 50.7281786 + (50.8679448 - 50.7581786)/2
        long = 6.0532093 + (6.11689568 - 6.0532093)/2

        mapoptions =
            zoom: 12
            center: [lat, long]
        for k,v of options
            mapoptions[k] = v

        resize = () ->
            if ($(window).width()>=980)
                $(@mapdiv).css("height", ($(window).height() - mapmargin))
                #$(mapdiv).css("margin-top",50)
            else
                $(@mapdiv).css("height", ($(window).height() - (mapmargin+12)))
                #$(mapdiv).css("margin-top",-21)

        mapmargin = 80
        $(@mapdiv).css("height", ($(window).height() - mapmargin))
        $(window).on("resize", resize)
        resize()

        L.mapbox.accessToken = @access_token
        @map = L.mapbox.map(@mapdiv.attr('id'), map_id, mapoptions)
        @initial_bounds = @map.getBounds()


        # layer toggler
        $('.togglelayer').click (e) =>
            #$(e.target).toggleClass('active')
            $(e.target).toggleClass('btn-default btn-success')
            layer = @layers[$(e.target).data('layer')]
            if @map.hasLayer(layer)
                @map.removeLayer(layer)
                #$(e.target).find('.fa').hide()
            else
                @map.addLayer(layer)
                #$(e.target).find('.fa').show()

        # reset mapbox
        $('#reset_map').click(() =>
            @map.fitBounds(@initial_bounds)
        )

        @elevation_popup = L.popup(@popup_options).setLatLng([0,0])


    init_draw_feature: () ->
        @drawn_items = new L.featureGroup().addTo(@map)
        @draw_control = new L.Control.Draw(
            edit:
                featureGroup: @drawn_items
                remove: false
            draw:
                polygon: false,
                polyline: true,
                rectangle: false,
                circle: false,
                marker: false
        )#.addTo(map)
        @map.on('draw:created', (e) ->
            @drawn_items.addLayer(e.layer)
        )
        @map_edit= new L.EditToolbar.Edit(@map,
            featureGroup: @draw_control.options.edit.featureGroup,
            selectedPathOptions: @draw_control.options.edit.selectedPathOptions
        )



    setup_segment: (segment) ->
        @map.fitBounds(segment.boundingbox)
        @initial_bounds = segment.boundingbox
        start = L.marker(segment.start,
            icon: @transition_icon
        ).addTo(@map)
        start.bindPopup("Übergangspunkt - Start", @popup_options)
        p = null
        start.on('mouseover', (e) =>
            p = @open_popup_as_layer(e.target)
        )
        start.on('mouseout', (e) =>
            @map.removeLayer(p)
        )
        end = L.marker(segment.end,
            icon: @transition_icon
        ).addTo(@map)
        end.bindPopup("Übergangspunkt - Ende",
                autoPan: false
                closeButton: false
        )
        end.on('mouseover', (e) =>
            p = @open_popup_as_layer(e.target)
        )
        end.on('mouseout', (e) =>
            @map.removeLayer(p)
        )

    setup_line_details: (segment) ->
        @linear_distance = @get_distance(@get_linestring([segment.start, segment.end], convert=false, swap=true))
        $('#linear-distance').html(@get_readable_distance(@linear_distance))
        @elevation_marker_layer = L.mapbox.featureLayer().addTo(@map)

    add_polyline: (points) ->
        @polyline = new L.polyline(points, @polyline_options).addTo(@map)
        if @drawn_items != null
            @drawn_items.addLayer(@polyline)

    clear_polyline: () ->
        if @polyline != null
            @map.removeLayer(@polyline)

    update_polyline_info: () ->
        if @polyline != null
            d = @get_distance(@get_linestring(@polyline.getLatLngs()))
            f = (d / @linear_distance).toFixed(2)
            $('#current-distance').html(@get_readable_distance(d))
            $('#distance-factor').html(f)


    update_elevation_data: () ->
        line = @get_linestring(@polyline.getLatLngs())
        distance = turf.lineDistance(line, 'kilometers')*1000
        sample_quant = Math.min(distance/50,220)
        @inc_dist = distance/sample_quant;
        new_sample_route = []
        for i in [0...sample_quant] by 1
            new_sample_route.push(turf.along(line,@inc_dist*i*0.001,'kilometers')['geometry']['coordinates'])
        url = "https://api.tiles.mapbox.com/v4/surface/mapbox.mapbox-terrain-v2.json?layer=contour&fields=ele,index&access_token="+@access_token+"&interpolate=true&geojson=true&points="
        points_string = $.map(new_sample_route, (p)->
            p[0]+","+p[1]
        ).join(";")
        $.get( url+points_string, (data) =>
            @create_barchart(data.results.features)
        )


    create_barchart: (data) ->
        Chart.defaults.global.showScale = false
        Chart.defaults.global.scaleShowLabels = false
        Chart.defaults.global.scaleBeginAtZero = true
        Chart.defaults.global.responsive = true
        Chart.defaults.global.maintainAspectRatio = true
        Chart.defaults.global.animation = false
        Chart.defaults.global.tooltipTemplate = "<%= value %> m"

        options =
            scaleShowGridLines : false
            barShowStroke : false
            barStrokeWidth : 0
            barValueSpacing : 0
            barDatasetSpacing : 0
        chart_data =
            labels: $.map(data, (d) ->
                ''
            )
            datasets: [
                fillColor: "rgba(220,220,220,0.8)",
                data: $.map(data, (f)->
                    [f.properties.ele]
                )
            ]

        ctx = $("#elevation").get(0).getContext("2d")
        ctx.canvas.height = 150
        if @chart != null
            @chart.destroy()
        @point_grades = []
        @chart = new Chart(ctx).Bar(chart_data, options)

        $.each(data, (i,n) =>
            point_grade = ''
            prev = if i>0  then data[i-1].properties.ele else n.properties.ele
            next = if i<data.length-1 then data[i+1].properties.ele else n.properties.ele
            curr = n.properties.ele
            point_grade = (0.5*((curr-prev)+(next-curr))/(2*@inc_dist)).toFixed(2)
            g = Math.abs(point_grade)
            @point_grades.push(g)
            if g > 0.05
                @chart.datasets[0].bars[i].fillColor = "rgba(201,48,44,0.8)"
            else if g > 0.03
                @chart.datasets[0].bars[i].fillColor = "rgba(240,173,78,0.8)"
            else if g >= 0
                @chart.datasets[0].bars[i].fillColor = "rgba(68,157,68,0.8)"
        )
        @chart.update()

        ctx.canvas.onmousemove = (e) =>
            active_bars = @chart.getBarsAtEvent(e)
            if active_bars.length > 0
                elem = active_bars[0]
                idx = @chart.datasets[0].bars.indexOf(elem)
                if idx == 0
                    marker_line = [data[idx],data[idx+1]]
                else if idx == data.length-1
                    marker_line = [data[idx-1],data[idx]]
                else
                    marker_line = [data[idx-1],data[idx],data[idx+1]]
                @set_elevation_marker(marker_line, elem._saved.fillColor)
                @elevation_popup
                    .setContent("Höhe: "+elem.value+" m<br />Steigung: "+@point_grades[idx]*100+"%")
                    .setLatLng(@geojson_to_latlng(data[idx]))
                    .update()

        ctx.canvas.onmouseover = (e) =>
            @map.addLayer(@elevation_popup)
            @polyline.setStyle(
                opacity: 0.25
            )

        ctx.canvas.onmouseout = (e) =>
            @set_elevation_marker([])
            @map.removeLayer(@elevation_popup)
            @polyline.setStyle(@polyline_options)
            #$('#grade_display').hide()


    set_elevation_marker: (points, color=null) ->
        points_array = $.map(points, (p) ->
            [p.geometry.coordinates if p]
        )
        marker_line = turf.linestring(points_array)
        @elevation_marker_layer.setGeoJSON(marker_line)
        @elevation_marker_layer.on('layeradd', (e) ->
            l = e.layer
            l.setStyle(
                color: color
                opacity: 1
                weight: 7
            )
        )

    #
    # helper functions
    #

    get_linestring: (points, convert=true, swap=false) ->
        if convert
            points_array = $.map(points, (p)->
                [[p.lng,p.lat]]
            )
        else
            points_array = points
        if swap
            points_array = $.map(points_array, (p)->
                [[p[1],p[0]]]
            )
        turf.linestring(points_array)

    get_distance: (line) ->
        d = turf.lineDistance(line, 'kilometers')*1000

    get_readable_distance: (d) ->
        L.GeometryUtil.readableDistance(d, true)

    geojson_to_latlng: (geojson) ->
        {'lat':geojson.geometry.coordinates[1], 'lng':geojson.geometry.coordinates[0]}

    open_popup_as_layer: (item) ->
        p = item.getPopup()
        p.setLatLng(item.getLatLng())
        @map.addLayer(p)
        p