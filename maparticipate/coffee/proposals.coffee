
$.fn.segment = (opts = {}) ->

    init = () ->
        basemap = new window.BaseMap($(this))
        basemap.setup_segment($(this).data("segment"))

        $('.proposal-item').hover(() ->
            $(this).addClass('bg-info')
            basemap.add_polyline($(this).data('route'))
        () ->
            $(this).removeClass('bg-info')
            basemap.clear_polyline()
        )

        $('.proposal-item').click(() ->
            window.open($(this).data('url'), '_self')
        )

    $(this).each(init)
    this

$.fn.proposal_view = (opts = {}) ->

    basemap = null
    comment_marker = null
    marker_icon_class = null

    init = () ->
        segment = $(this).data("segment")
        basemap = new window.BaseMap($(this))
        basemap.setup_segment(segment)
        basemap.setup_line_details(segment)
        basemap.add_polyline($(this).data("route"), with_update=true)
        basemap.update_polyline_info()
        basemap.update_elevation_data()

        mapcomments = new window.MapComments(basemap)
        mapcomments.load_mapcomments()

        $('#comment_button').click(() ->
            $('#comment_block').show()
            $(this).hide()
        )
        $('#comment_cancel').click((e) ->
            e.preventDefault()
            clear_marker()
            $('.comment_marker').removeClass('active')
            $('#comment_block').hide()
            $('#comment_button').show()
        )
        $('.comment_marker').click(() ->
            marker_icon_class = $(this).find('i').attr('class')
            if $(this).hasClass('active')
                $(this).removeClass('active')
                # TODO: disable marker setting
                basemap.map.off('click', set_comment_marker)
            else
                $('.comment_marker').removeClass('active')
                $(this).addClass('active')
                # TODO: enable marker setting
                basemap.map.on('click', set_comment_marker)
        )

    clear_marker = () ->
        if comment_marker != null
            basemap.map.removeLayer(comment_marker)

    set_comment_marker = (e) ->
        clear_marker()
        comment_marker = new L.marker(e.latlng,
            draggable:'true'
            icon: L.divIcon(
                className: marker_icon_class+' fa-2x'
            )
        )
        basemap.map.addLayer(comment_marker)
        loc_string = JSON.stringify([e.latlng.lat,e.latlng.lng])
        $('form#add_comment_form input[name=location]').val(loc_string)
        $('form#add_comment_form input[name=icon]').val(marker_icon_class)


    $(this).each(init)
    this


$.fn.proposal_edit = (opts = {}) ->

    mapdiv =
    basemap = null
    comments = null
    show_edit_tooltip = false
    saved = false
    save_button = null
    cancel_button = null
    publish_button = null
    initial_route = null
    route_coords = null
    is_create = false
    save_url = null

    init = () ->
        setup_map($(this))
        setup_map_comments()

        is_create = $(this).data('is_create')

        save_button = $('#save-proposal-form-button')
        cancel_button = $('#cancel-proposal-form-button')
        publish_button = $('#publish-proposal-form-button')

        # editing
        $('#save-proposal-form').submit((e) ->
            e.preventDefault()
            basemap.update_elevation_data()
            data = {}
            $.each($(this).serializeArray(), (i, input) ->
                data[input.name] = input.value
            )
            data.route = JSON.stringify(route_coords)
            data.mapcomments = JSON.stringify(comments.to_list())

            if not save_url?
                if is_create
                    save_url = $(this).data('create_url')
                else
                    save_url = $(this).attr('action')

            $.ajax
                url: save_url
                method: 'POST'
                data: data
                dataType: "json"
                success: (data, textStatus, jqXHR) ->
                    if data.status == 'OK'
                        lock_save_button()
                        basemap.map.closePopup()
                        initial_route = route_coords
                        save_url = data.edit_url
                        # redirect to edit screen
                        if is_create
                            window.location.href = data.edit_url
            )

        $('textarea#route_description').on('keyup',() ->
            unlock_save_button()
        )

        if show_edit_tooltip
            $('.leaflet-editing-icon:last').tooltip(
                title: $("body").data("i18n-draghere")
                trigger: 'manual'
            ).tooltip('show')
            $('.leaflet-editing-icon').on('mousedown', () ->
                $(this).tooltip('destroy')
            )

        save_button.attr('disabled', 'disabled')

    setup_map = (mapdiv) ->
        basemap = new window.BaseMap(mapdiv, with_draw=true)
        basemap.init_draw_feature()
        segment = mapdiv.data("segment")
        basemap.setup_segment(segment)
        basemap.setup_line_details(segment)
        initial_route = mapdiv.data("route")
        if not initial_route
            show_edit_tooltip = true
            initial_route = [segment.start, segment.end]
        basemap.add_polyline(initial_route)
        basemap.update_polyline_info()
        basemap.update_elevation_data()
        basemap.map_edit.enable()
        basemap.map.on('mousemove', (e) ->
            basemap.update_polyline_info()
            route_coords = $.map(basemap.polyline.getLatLngs(), (p)->
                [[p.lat, p.lng]]
            )
            if route_coords.toString() != initial_route.toString()
                unlock_save_button()
        )
        $('#update_elevation_chart').show().click(() ->
            basemap.update_elevation_data()
        )


    setup_map_comments = () ->
        comments = new window.MapComments(basemap)
        comments.load_mapcomments_for_edit()
        comments.on('changed', ()->
            unlock_save_button()
        )
        $('.add_mapcomment').click(comments.add_new_comment_marker)
        basemap.mapdiv.on('click', '#cancel_mapcomment', comments.cancel_new_comment_marker)
        basemap.mapdiv.on('click', '#delete_mapcomment', comments.delete_comment_marker)
        basemap.mapdiv.on('click', '#ok_mapcomment', comments.close_current_marker)

    lock_save_button = () ->
        save_button.attr('disabled', 'disabled')
        save_button.html('<i class="fa fa-check"></i> gespeichert')
        cancel_button.hide()
        publish_button.show()

        # let user savely exit page again
        $(window).unbind('beforeunload')

    unlock_save_button = () ->
        save_button.show()
        save_button.attr('disabled', null)
        save_button.html('speichern')
        cancel_button.show()
        publish_button.hide()
        $(window).bind('beforeunload', () ->
            return 'Ihre Änderungen sind noch nicht gespeichert.'
        )

    $(this).each(init)
    this


$.fn.own_overview = (opts = {}) ->

    init = () ->
        basemap = new window.BaseMap($(this))

        $('.proposal-item').hover(() ->
            $(this).addClass('bg-info')
            basemap.add_polyline($(this).data('route'))
        () ->
            $(this).removeClass('bg-info')
            basemap.clear_polyline()
        )

        $('.proposal-item').click(() ->
            window.open($(this).data('url'), '_self')
        )

    $(this).each(init)
    this


$(document).ready( () ->
    $('#segment-map').segment()
    $('#proposal-view-map').proposal_view()
    $('#proposal-edit-map').proposal_edit()
    $('#own-overview-map').own_overview()
)