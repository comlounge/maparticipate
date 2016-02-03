
class @MapComments

    basemap: null
    mode: 'view'
    events: null

    popup_view_templates:
        comment: """
    {{comment}}
    {{#author}}
        <div class="text-muted">
            <small>
            von {{author_name}}
            <br />
            {{updated_string}}
            </small>
        </div>
    {{/author}}
    """
        bruecke: """
    <div class="text-center"><b>Brücke</b></div>
    {{#comment}}
        {{comment}}
    {{/comment}}
    """
        tunnel: """
    <div class="text-center"><b>Unterführung</b></div>
    {{#comment}}
        {{comment}}
    {{/comment}}
    """

    comment_form: """
<textarea name='comment' class='form-control' id='map-comment-input' rows='4' required>{{comment}}</textarea>
<button class="btn btn-xs btn-default" id="ok_mapcomment">ok</button>
<div class='pull-right'>

    <!--input type='submit' class='btn btn-primary btn-xs' value='speichern'-->
    {{#create}}
        <button class='btn btn-default btn-xs' id='cancel_mapcomment'>
            abbrechen
        </button>
    {{/create}}
    {{^create}}
        <button class='btn btn-danger btn-xs' id='delete_mapcomment'>
            <i class='fa fa-trash'></i>
        </button>
    {{/create}}
</div>
<div class='clearfix'></div>
"""

    admin_comment_form: """
{{comment}}
{{#author}}
    <div class="text-muted">
        <small>
        von {{author_name}}
        <br />
        {{updated_string}}
        </small>
    </div>
{{/author}}
<div class='pull-right'>
    <button class='btn btn-danger btn-xs' id='delete_mapcomment'>
        <i class='fa fa-trash'></i>
    </button>
</div>
<div class='clearfix'></div>
"""

    global_comment_form: """
<textarea name='comment' class='form-control' id='map-comment-input' rows='4' required>{{comment}}</textarea>
<button class="btn btn-xs btn-primary" id="ok_mapcomment">speichern</button>
<div class='pull-right'>

    <!--input type='submit' class='btn btn-primary btn-xs' value='speichern'-->
    {{#create}}
        <button class='btn btn-default btn-xs' id='cancel_mapcomment'>
            abbrechen
        </button>
    {{/create}}
    {{^create}}
        <button class='btn btn-danger btn-xs' id='delete_mapcomment'>
            <i class='fa fa-trash'></i>
        </button>
    {{/create}}
</div>
<div class='clearfix'></div>
"""

    mapcomments: {}
    current_mapcomment: null
    current_mapcomment_marker: null
    mapcomment_dict:
        comment:  null
        location: null
        type: null
        create: true
    map_comments_layer: new L.LayerGroup()

    add_icon: null

    icon_template: """<span class='fa-stack fa-lg'>
    <i class='fa fa-circle fa-stack-2x' style='color:#142862;'></i>
    <i class='fa fa-{{type}} fa-stack-1x fa-inverse'></i>
</span>"""

    icons:
        tunnel: L.icon(
            iconUrl: "/static/img/tunnel.png",
            iconSize: [50, 50]
            #iconAnchor: [25, 25]
            #popupAnchor: [0, -25]
            #className: "dot"
        )
        bruecke: L.icon(
            iconUrl: "/static/img/bruecke.png",
            iconSize: [50, 50]
            #iconAnchor: [25, 25]
            #popupAnchor: [0, -25]
            #className: "dot"
        )
        comment: L.divIcon(
            className: 'fa-icon'
            html: """<span class='fa-stack fa-lg'>
    <i class='fa fa-circle fa-stack-2x'></i>
    <i class='fa fa-comment fa-stack-1x fa-inverse'></i>
</span>"""
            iconSize: [22,22]
            popupAnchor: [6,0]
        )

    constructor: (@basemap) ->
        @map_comments_layer.addTo(@basemap.map)
        # popup when popup was dragged
        @basemap.mapdiv.on('keyup', '#map-comment-input', (e) =>
            @save_current_mapcomment(e.target.value)
        )
        # changed event
        @events =
            changed: null

    on: (evt_name, cb) ->
        @events[evt_name] = cb

    trigger: (evt_name) ->
        if @events[evt_name] != null
            @events[evt_name]()

    # get all map comments from proposal an display them
    load_mapcomments: (popup_template=@comment_view) ->
        $.ajax
            url: @basemap.mapdiv.data('mapcomment_url')
            method: 'GET'
            dataType: "json"
            success: (data, textStatus, jqXHR) =>
                for c in data['comments']
                    m = @create_marker(c.location, c.type)
                    if @mode == 'view'
                        popup_template = @popup_view_templates[c.type]
                    m.getPopup().setContent(Mustache.render(popup_template, c)).update()
                    @mapcomments[m._leaflet_id] = c
                if data['edit']?
                    @mode = 'edit'

    load_mapcomments_for_view: () ->
        @mode = 'view'
        @load_mapcomments(@comment_view)

    load_mapcomments_for_edit: () ->
        @mode = 'edit'
        @load_mapcomments(@comment_form)


    create_marker: (loc, type) ->
        icon = @icons[type]
        marker = new L.Marker(loc,
            draggable: @mode=='edit'
            icon: icon
        )
        @map_comments_layer.addLayer(marker)
        if @mode == 'view'
            marker.bindPopup(Mustache.render(@comment_view), @basemap.popup_options)
            marker.on('mouseover', (e) ->
                marker.openPopup()
            )
            marker.on('mouseout', (e) ->
                marker.closePopup()
            )
        else
            # set add-popup
            marker.bindPopup(Mustache.render(@comment_form,
                create: true
            ),
                closeButton: false
            )
            marker.on('dragstart', (e) =>
                e.target.closePopup()
            )
            marker.on('dragend', (e) =>
                # set popup content again because possible input was lost during dragging
                e.target.getPopup()
                        .setContent(Mustache.render(@comment_form, @mapcomments[e.target._leaflet_id]))
                        .update()
                # and open popup again since it was closed on click
                e.target.openPopup()
                @save_current_mapcomment()
            )
            marker.on('popupopen', (e) =>
                # remember current marker
                @current_mapcomment_marker = e.target
                # we're adding or editing when popup ist open
                # so disable polyline edit
                if @basemap.map_edit?
                    @basemap.map_edit.disable()
            )
            marker.on('popupclose', (e) =>
                # reenable polyline edit
                if @basemap.map_edit?
                    @basemap.map_edit.enable()
                # forget current marker
                @current_mapcomment_marker = null
                # forget current comment
            )
        marker

    add_new_comment_marker: (e) =>
        # initialize with center of map location
        center = @basemap.map.getCenter()
        # save type for saving later
        @add_icon = $(e.target).data('icon')
        m = @create_marker([center.lat,center.lng], @add_icon)
        # open popup with form
        m.openPopup()
        if @add_icon in ['bruecke', 'tunnel']
            @save_current_mapcomment()

    close_current_marker: () =>
        @current_mapcomment_marker = null
        @basemap.map.closePopup()

    cancel_new_comment_marker: () =>
        @remove_current_marker()

    delete_comment_marker: () =>
        current = @mapcomments[@current_mapcomment_marker._leaflet_id]
        @remove_current_marker()
        # only trigger when comment is not empty
        if not current.type == 'comment' or current.comment?
            @trigger('changed')

    remove_current_marker: () =>
        # remove comment from dict of all comments
        delete @mapcomments[@current_mapcomment_marker._leaflet_id]
        # remove marker from map
        @map_comments_layer.removeLayer(@current_mapcomment_marker)
        # forget current marker
        @current_mapcomment_marker = null
        # close popup
        @basemap.map.closePopup()

    save_current_mapcomment: (comment=null) =>
        current_marker_id = @current_mapcomment_marker._leaflet_id
        if current_marker_id not of @mapcomments
            @mapcomments[current_marker_id] = $.extend(true, {}, @mapcomment_dict)
        current = @mapcomments[current_marker_id]
        if comment
            current.comment = comment
        loc = @current_mapcomment_marker.getLatLng()
        current.location = [loc.lat,loc.lng]
        current.create = false
        if @add_icon
            current.type = @add_icon
            @add_icon = null
        # set popup content again this time with edit-popup
        @current_mapcomment_marker.bindPopup(Mustache.render(@comment_form, current),@basemap.popup_options)
        # only trigger when comment is not empty
        if current.type != 'comment' or current.comment?
            @trigger('changed')

    to_list: () =>
        #result = []
        #for id, c of @mapcomments
            ## only save if comment was filled
            #if c.type != 'comment' or c.comment
                #result.push(c)
        #result
        $.map(@mapcomments, (c)->
            c
        )

    clear_markers: () =>
        @mapcomments = {}
        @basemap.map.removeLayer(@map_comments_layer)
        @map_comments_layer = new L.LayerGroup()
        @basemap.map.addLayer(@map_comments_layer)