 $(function () {
	        function log(message) {
	           //  $("<div/>").text(message).prependTo("#log");
	           // $("#log").scrollTop(0);
	        } 

         var searchInput = dojo.create('input', {
            id: 'searchField',
            type: 'text',
            placeholder: 'Find an address', //i18n.tools.search.title,
            onkeydown: function (e) {
              if (e.keyCode === 13) {
                findLocation(this.value);
              }
            }
          }, wrapperDiv);
          dojo.addClass(dojo.byId('searchField'), 'searchbox');

	        $("#searchField").autocomplete({
	            source: function (request, response) {
	                $.ajax({
	                    url: "http://210.4.210.98/MapViewerWebServices/searchJSON.ashx",
	                    dataType: "jsonp",
	                    data: {
	                        searchType: "Address", // TODO change this depending on dropdown value
	                        //style: "full",
	                        maxRows: 10,
	                        searchTerm: request.term
	                    },
	                    success: function (data) {
	                        response($.map(data.results, function (item) {
	                            return {
	                                label: item.name, // + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
	                                value: item.name
	                            }
	                        }));
	                    }
	                });
	            },
	            minLength: 2,
	            select: function (event, ui) {
                log(ui.item ?
					"Selected: " + ui.item.label :
					"Nothing selected, input was " + this.value);
	            } , 
	            open: function () {
	                $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
	            },
	            close: function () {
	                $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
	            }
	        });
	    });


var urlParams = {}; 

(function () { 
  var e, 
    a = /\+/g,  // Regex for replacing addition symbol with a space 
    r = /([^&=]+)=?([^&]*)/g, 
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); }, 
    q = window.location.search.substring(1); 

  while (e = r.exec(q)) 
   urlParams[d(e[1])] = d(e[2]); 
})(); 

$(document).ready(function() { 
 
//var propertyDetails = parseInt(urlParams["propertyDetails"]);

 //alert(propertyDetails); 

 /*   $.blockUI({ message: $('#splashscreen'), css: { 'width': '550px','height': '400px','margin-top':'-100px' }}); 
    $('#continue').click(function() { 
         $.unblockUI(); 
        return false; 
    });  */
    
 //   alert(propertyDetails); 
 
 // $('#users').change(function() { 
 //   $('#myLabel').text($(this).val()); 
 // }); 
}); 

