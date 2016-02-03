    $(document).ready () ->
	    if $(".parsley-validate").length                                                                                                                                                                                                                                  
	        $(".parsley-validate").parsley(
	            excluded: "input[type=file]"
	            errorsWrapper: "<span class='errors-block help-block'></span>"
	            errorsContainer: (el) ->
	                el.$element.closest("div")
	        )
