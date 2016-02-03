
$.fn.segments = (opts = {}) ->

    basemap = null
    map = null
    bbox = null
    start = null
    end = null
    line = null

    init = () ->
        mapdiv = $('#overview-map')
        options =
            zoomControl: false
            scrollWheelZoom: false
            touchZoom: false
            dragging: false
            doubleClickZoom: false
            boxZoom: false
        basemap = new window.BaseMap(mapdiv, options, with_layers=false)
        for s in $('li.segment')
            setup_segment($(s).data('segment'))

        $('li.segment').hover(() ->
            $(this).addClass('bg-info')
            bbox = L.rectangle($(this).data('segment').boundingbox,
                color: "#ff7800"
                weight: 1
            ).addTo(basemap.map)
        () ->
            $(this).removeClass('bg-info')
            basemap.map.removeLayer(bbox)
        )

        $('li.segment').click(() ->
            window.open($(this).data('url'), '_self')
        )

    setup_segment = (segment) ->
        start = L.marker(segment.start,
            icon: basemap.transition_icon
        ).addTo(basemap.map)
        end = L.marker(segment.end,
            icon: basemap.transition_icon
        ).addTo(basemap.map)
        basemap.add_polyline([segment.start, segment.end])

    $(this).each(init)
    this


$.fn.comments = (opts = {}) ->

    basemap = null
    comments = null
    #save_button = null
    is_admin = false

    init = () ->
        options =
            touchZoom: false
            doubleClickZoom: false
            boxZoom: false
        basemap = new window.BaseMap($(this))
        comments = new window.MapComments(basemap)
        is_admin = true if basemap.mapdiv.data('isadmin') == 'True'
        setup_map_comments()
        #save_button = $('#save-comments-button')
        #save_button.on('click', save_mapcomments)
        $('.add_mapcomment').click(comments.add_new_comment_marker)
        #basemap.mapdiv.on('submit', '#mapcomment_form', comments.submit_mapcomments)
        basemap.mapdiv.on('click', '#cancel_mapcomment', comments.cancel_new_comment_marker)
        basemap.mapdiv.on('click', '#delete_mapcomment', (e) ->
            if confirm('Soll der Kommentar wirklich gelöscht werden?')
                comments.delete_comment_marker()
                save_mapcomments()
            else
                comments.close_current_marker()
        )
        basemap.mapdiv.on('click', '#ok_mapcomment', (e) ->
            current = comments.mapcomments[comments.current_mapcomment_marker._leaflet_id]
            if not current? or not current.comment?
                comments.cancel_new_comment_marker()
            else
                comments.save_current_mapcomment()
                comments.close_current_marker()
                save_mapcomments()
        )

    setup_map_comments = () ->
        if is_admin
            comments.comment_form = comments.admin_comment_form
            comments.load_mapcomments_for_edit()
        else
            comments.comment_form = comments.global_comment_form
            comments.load_mapcomments_for_view()
        #comments.on('changed', ()->
        #    save_button.show()
        #)

    save_mapcomments = () ->
        $.ajax
            url: document.URL
            method: 'POST'
            data:
                mapcomments: JSON.stringify(comments.to_list())
            dataType: "json"
            success: (data, textStatus, jqXHR) ->
                if data.status == 'OK'
                    #save_button.hide()
                    basemap.map.closePopup()
                    comments.clear_markers()
                    #comments.load_mapcomments_for_view()
                    setup_map_comments()


    $(this).each(init)
    this


$(document).ready( () ->
    $('#overview-list').segments()
    $('#comments-overview-map').comments()
)

