dojo.require("esri.map");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.tasks.find");
dojo.require("esri.tasks.locator");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.dijit.OverviewMap");
dojo.require("esri.dijit.Measurement");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.TimeSlider");
dojo.require("esri.dijit.editing.Editor-all");
dojo.require("esri.arcgis.utils");
dojo.require("esri.IdentityManager");
dojo.require("dojox.layout.FloatingPane");
dojo.require("esri.dijit.Bookmarks");
dojo.require("myModules.custommenu");
dojo.require("esri.dijit.Print");
dojo.require("apl.ElevationsChart.Pane");

var _maps = [];
var _syncScale = true;
var _syncLocation = true;

var locator;
var clickHandler, clickListener;
var editLayers = [],editorWidget;
var webmapExtent;
var _mapExtentChangeEvent;

var urlObject;
var findTask, findTaskCemetery, findTaskRoad, findParams;
var searchStr, searchvalue, ddlsearchValue;
var measure;
var zoomHandles = {};

var toolLocations = {
    "map.0":"webmap-toolbar-center-left",
    "map.1": "webmap-toolbar-center-right"
}

function initMap() {

  initSearch();

  //setup defaults
  if (configOptions.geometryserviceurl && location.protocol === "https:") {
    configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');
  }
  esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);


  if (!configOptions.sharingurl) {
    configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
  }

  esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;


  if(!configOptions.proxyurl){
	configOptions.proxyurl = location.protocol + '//' + location.host + "/sharing/proxy";
   }


  esri.config.defaults.io.corsEnabledServers.push(location.protocol + '//' + location.host);

  esri.config.defaults.io.proxyUrl = configOptions.proxyurl;

  esri.config.defaults.io.alwaysUseProxy = false;



  urlObject = esri.urlToObject(document.location.href);

  //is an appid specified - if so read json from there
  if (configOptions.appid || (urlObject.query && urlObject.query.appid)) {
    var appid = configOptions.appid || urlObject.query.appid;
    var requestHandle = esri.request({
      url: configOptions.sharingurl + "/" + appid + "/data",
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      load: function (response) {
        if (response.values.title !== undefined) {
          configOptions.title = response.values.title;
        }
        if (response.values.description !== undefined) {
          configOptions.description = response.values.description;
        }
        if (response.values.displaytitle !== undefined) {
          configOptions.displaytitle = response.values.displaytitle;
        }
        if (response.values.theme !== undefined) {
          configOptions.theme = response.values.theme;
        }
        if (response.values.displayeditor !== undefined) {
          configOptions.displayeditor = response.values.displayeditor;
        }
        if (response.values.displayprint !== undefined) {
          configOptions.displayprint = response.values.displayprint;
        }
        if (response.values.displaytimeslider !== undefined) {
          configOptions.displaytimeslider = response.values.displaytimeslider;
        }
        if (response.values.displaybookmarks !== undefined) {
          configOptions.displaybookmarks = response.values.displaybookmarks;
        }
        if (response.values.displaymeasure !== undefined) {
          configOptions.displaymeasure = response.values.displaymeasure;
        }
        if (response.values.displaylegend !== undefined) {
          configOptions.displaylegend = response.values.displaylegend;
        }
        if (response.values.displaydetails !== undefined) {
          configOptions.displaydetails = response.values.displaydetails;
        }
        if (response.values.displaylayerlist !== undefined) {
          configOptions.displaylayerlist = response.values.displaylayerlist;
        }
        if (response.values.displaybasemaps !== undefined) {
          configOptions.displaybasemaps = response.values.displaybasemaps;
        }
        if (response.values.displayshare !== undefined) {
          configOptions.displayshare = response.values.displayshare;
        }
        if (response.values.displaysearch !== undefined) {
          configOptions.displaysearch = response.values.displaysearch;
        }
        if (response.values.displayslider !== undefined) {
          configOptions.displayslider = response.values.displayslider;
        }
        if (response.values.displayelevation !== undefined) {
          configOptions.displayelevation = response.values.displayelevation;
        }
        if (response.values.showelevationdifference !== undefined) {
          configOptions.showelevationdifference === response.values.showelevationdifference;
        }
        if (response.values.displayoverviewmap !== undefined) {
          configOptions.displayoverviewmap = response.values.displayoverviewmap;
        }
        if (response.values.webmap !== undefined) {
          configOptions.webmap = response.values.webmap;
        }
        if (response.values.link1text !== undefined) {
          configOptions.link1.text = response.values.link1text;
        }
        if (response.values.link1url !== undefined) {
          configOptions.link1.url = response.values.link1url;
        }
        if (response.values.link2text !== undefined) {
          configOptions.link2.text = response.values.link2text;
        }
        if (response.values.link2url !== undefined) {
          configOptions.link2.url = response.values.link2url;
        }
        if (response.values.placefinderurl !== undefined) {
          configOptions.placefinder.url = response.values.placefinderurl;
        }
        if (response.values.embed !== undefined) {
          configOptions.embed = response.values.embed;
        }
        if (response.values.placefinderfieldname !== undefined) {
          configOptions.placefinder.singlelinefieldname = response.values.placefinderfieldname;
        }
        if (response.values.customlogoimage !== undefined) {
          configOptions.customlogo.image = response.values.customlogoimage;
        }
        if (response.values.customlogolink !== undefined) {
          configOptions.customlogo.link = response.values.customlogolink;
        }
        if (response.values.basemapgrouptitle !== undefined && response.values.basemapgroupowner !== undefined) {
          configOptions.basemapgroup.title = response.values.basemapgrouptitle;
          configOptions.basemapgroup.owner = response.values.basemapgroupowner;
        }
        createApp();
      },
      error: function (response) {
        var e = response.message;
        alert(i18n.viewer.errors.createMap + " : " + e);
      }
    });

  } else {
    createApp();
  }

}

function createApp() {
  //override configuration settings if any url parameters are set
  if (urlObject.query) {
    if (urlObject.query.title) {
      configOptions.title = urlObject.query.title;
    }
    if (urlObject.query.customlogoimage) {
      configOptions.customlogo.image = urlObject.query.customlogoimage;
    }
    if (urlObject.query.webmap) {
      configOptions.webmap = urlObject.query.webmap;
    }
    if (urlObject.query.displaytitle) {
      configOptions.displaytitle = (urlObject.query.displaytitle === 'true') ? true : false;
    }
    if (urlObject.query.theme) {
      configOptions.theme = urlObject.query.theme;
    }
    if (urlObject.query.bingmapskey) {
      configOptions.bingmapskey = urlObject.query.bingmapskey;
    }
    if (urlObject.query.displaymeasure) {
      configOptions.displaymeasure = (urlObject.query.displaymeasure === 'true') ? true : false;
    }
    if (urlObject.query.displayshare) {
      configOptions.displayshare = (urlObject.query.displayshare === 'true') ? true : false;
    }
    if (urlObject.query.displaybasemaps) {
      configOptions.displaybasemaps = (urlObject.query.displaybasemaps === 'true') ? true : false;
    }
    if (urlObject.query.displayoverviewmap) {
      configOptions.displayoverviewmap = (urlObject.query.displayoverviewmap === 'true') ? true : false;
    }
    if (urlObject.query.displayeditor) {
      configOptions.displayeditor = (urlObject.query.displayeditor === 'true') ? true : false;
    }
    if (urlObject.query.displaylegend) {
      configOptions.displaylegend = (urlObject.query.displaylegend === 'true') ? true : false;
    }
    if (urlObject.query.displaysearch) {
      configOptions.displaysearch = (urlObject.query.displaysearch === 'true') ? true : false;
    }
    if (urlObject.query.displaybookmarks) {
      configOptions.displaybookmarks = (urlObject.query.displaybookmarks === 'true') ? true : false;
    }
    if (urlObject.query.displaylayerlist) {
      configOptions.displaylayerlist = (urlObject.query.displaylayerlist === 'true') ? true : false;
    }
    if (urlObject.query.displaydetails) {
      configOptions.displaydetails = (urlObject.query.displaydetails === 'true') ? true : false;
    }
    if (urlObject.query.displaytimeslider) {
      configOptions.displaytimeslider = (urlObject.query.displaytimeslider === 'true') ? true : false;
    }
    if (urlObject.query.displayelevation) {
      configOptions.displayelevation = (urlObject.query.displayelevation === 'true') ? true : false;
    }
    if (urlObject.query.showelevationdifference) {
      configOptions.showelevationdifference = (urlObject.query.showelevationdifference === 'true') ? true : false;
    }
    if (urlObject.query.displayprint) {
      configOptions.displayprint = (urlObject.query.displayprint === 'true') ? true : false;
    }
    if (urlObject.query.displayscalebar) {
      configOptions.displayscalebar = (urlObject.query.displayscalebar === 'true') ? true : false;
    }
    if (urlObject.query.displayslider) {
      configOptions.displayslider = (urlObject.query.displayslider === 'true') ? true : false;
    }
    if (urlObject.query.constrainmapextent) {
      configOptions.constrainmapextent = (urlObject.query.constrainmapextent === 'true') ? true : false;
    }
    if (urlObject.query.basemapGroupOwner && urlObject.query.basemapGroupTitle) {
      configOptions.basemapgroup.title = urlObject.query.basemapGroupTitle;
      configOptions.basemapgroup.owner = urlObject.query.basemapGroupOwner;
    }
    if (urlObject.query.extent) {
      configOptions.extent = urlObject.query.extent;
    }
    if (urlObject.query.gcsextent) {
      configOptions.gcsextent = urlObject.query.gcsextent;
    }
    if (urlObject.query.customLogoImage) {
      configOptions.customlogo.image = urlObject.query.customLogoImage;
    }
    if (urlObject.query.embed) {
      configOptions.embed = (urlObject.query.embed === 'true') ? true : false;
    }
    if (urlObject.query.leftpanelvisible) {
      configOptions.leftPanelVisibility = (urlObject.query.leftpanelvisible === 'true') ? true : false;
    }
  }

  //load the specified theme
  var ss = document.createElement("link");
  ss.type = "text/css";
  ss.rel = "stylesheet";
  ss.href = "css/" + configOptions.theme + ".css";
  document.getElementsByTagName("head")[0].appendChild(ss);

  //will this app be embedded - if so turn off title and links
  if (configOptions.embed === "true" || configOptions.embed === true) {
    configOptions.displaytitle = false;
    configOptions.link1.url = "";
    configOptions.link2.url = "";
  }else{
    dojo.addClass(dojo.body(),'notembed');
    dojo.query("html").addClass("notembed");
  }

  //create the links for the top of the application if provided
  if (configOptions.link1.url && configOptions.link2.url) {
    if (configOptions.displaytitle == "false" || configOptions.displaytitle === false) {
      //size the header to fit the links
      dojo.style(dojo.byId("header"), "height", "25px");
    }
    esri.show(dojo.byId('nav'));
    dojo.create("a", {
      href: configOptions.link1.url,
      target: '_blank',
      innerHTML: configOptions.link1.text
    }, 'link1List');
    dojo.create("a", {
      href: configOptions.link2.url,
      target: '_blank',
      innerHTML: configOptions.link2.text
    }, 'link2List');
  }


  //create the map and enable/disable map options like slider, wraparound, esri logo etc
  if (configOptions.displayslider === 'true' || configOptions.displayslider === true) {
    configOptions.displaySlider = true;
  } else {
    configOptions.displaySlider;
  }
  if (configOptions.constrainmapextent === 'true' || configOptions.constrainmapextent === true) {
    configOptions.constrainmapextent = true;
  } else {
    configOptions.constrainmapextent = false;
  }

  if (configOptions.gcsextent) {

    //make sure the extent is valid minx,miny,maxx,maxy
    var extent = configOptions.gcsextent;
    if (extent) {
      var extArray = extent.split(",");
      if (dojo.some(extArray, function (value) {
        return isNaN(value);
      })) {
        getItem(configOptions.webmap);
      } else {
        if (extArray.length == 4) {
          getItem(configOptions.webmap, extArray);
        } else {
            createMap(configOptions.webmap0, "map.0").then(
                function (result) {
                    createMap(configOptions.webmap1, "map.1")
                });
        }
      }
    }
  } else {
      createMap(configOptions.webmap0, "map.0").then(
          function (anotherResult) {
              createMap(configOptions.webmap1, "map.1")
          });
  }
}

function getItem(item, extArray) {
  //get the item and update the extent then create the map
  var deferred = esri.arcgis.utils.getItem(item);

  deferred.addCallback(function (itemInfo) {
    if (extArray) {
      itemInfo.item.extent = [
        [parseFloat(extArray[0]), parseFloat(extArray[1])],
        [parseFloat(extArray[2]), parseFloat(extArray[3])]
      ];
    }
    createMap(itemInfo);
  });

  deferred.addErrback(function (error) {
    alert(i18n.viewer.errors.createMap + " : " + dojo.toJson(error.message));
  });
}

function createMap(webmapitem, mapDiv) {
    var def = new dojo.Deferred();
    var mapDeferred = esri.arcgis.utils.createMap(webmapitem, mapDiv, {
    mapOptions: {
      slider: configOptions.displaySlider,
      nav: false,
      wrapAround180: false, // RMD - added this line
      ///wrapAround180: !configOptions.constrainmapextent,
      //set wraparound to false if the extent is limited.
      logo: !configOptions.customlogo.image //hide esri logo if custom logo is provided
    },
    ignorePopups: false,
    bingMapsKey: configOptions.bingmapskey
    });

    console.log("createMap - " + mapDiv);

    mapDeferred.addCallback(function (response) {
        //add webmap's description to details panel
        console.log("mapDeferred.addCallback - " + response.map.id);

        if (configOptions.description === "") {
            if (response.itemInfo.item.description !== null) {
                configOptions.description = response.itemInfo.item.description;
            }
        }

        configOptions.owner = response.itemInfo.item.owner;
        document.title = configOptions.title || response.itemInfo.item.title;
        //add a title
        if (configOptions.displaytitle === "true" || configOptions.displaytitle === true) {
            configOptions.title = configOptions.title || response.itemInfo.item.title;
            dojo.create("p", {
                id: 'webmapTitle',
                innerHTML: configOptions.title
            }, "header");
            dojo.style(dojo.byId("header"), "height", "38px");
        } else if (!configOptions.link1.url && !configOptions.link2.url) {
            //no title or links - hide header
            esri.hide(dojo.byId('header'));
            dojo.addClass(dojo.body(), 'embed');
            dojo.query("html").addClass("embed");
        }


        //get the popup click handler so we can disable it when measure tool is active
        clickHandler = response.clickEventHandle;
        clickListener = response.clickEventListener;
        map2 = response.map;
        //Constrain the extent of the map to the webmap's initial extent
        if (configOptions.constrainmapextent === 'true' || configOptions.constrainmapextent === true) {
            webmapExtent = response.map.extent.expand(1.5);
        }

        //if an extent was specified using url params go to that extent now
        if (configOptions.extent) {
            map2.setExtent(new esri.geometry.Extent(dojo.fromJson(configOptions.extent)));
        }

        if (map2.loaded) {
            initUI(map2, response);
        } else {
            dojo.connect(map2, "onLoad", function () {
                initUI(map2, response);
            });
        }
        //dojo.connect(dijit.byId(map.id), 'resize', map, resizeMap);
        // CONNECT RESIZE EVENT
        // the map2 variable gets rescoped the second time this gets called so event gets connected twice to the same handle - make sure we are getting the correct map
        var anId = map2.id.toString();

        dojo.connect(dijit.byId(anId), 'resize', function () {
            resizeMap(anId);
            });
        
        dojo.connect(getMap(anId).infoWindow, "onShow", function () {
            zoomHandles[anId+'zm'] = dojo.connect(getMap(anId), "onZoomStart", function (a, b, c, d) {
                dojo.disconnect(zoomHandles[anId]);
                connectEvents(getMap(anId));
            });

            zoomHandles[anId + 'pan'] = dojo.connect(getMap(anId), "onPanStart", function (a, b, c, d) {
                dojo.disconnect(zoomHandles[anId]);
                connectEvents(getMap(anId));
            });
        });

        dojo.connect(getMap(anId).infoWindow, "onHide", function () {
            if (zoomHandles[anId+'zm']) {
                dojo.disconnect(zoomHandles[anId+'zm']);
            } if (zoomHandles[anId + 'pan']) {
                dojo.disconnect(zoomHandles[anId + 'pan']);
            }
        });
        def.resolve();
    });

  mapDeferred.addErrback(function (error) {
    alert(i18n.viewer.errors.createMap + " : " + dojo.toJson(error.message));
  });
  return def.promise;
}

function initUI(map, response) {

    var mapIdPrefix = map.id
    var containerNum = map.id.split('.')[1];
    // ADD MAP TO ARRAY OF MAPS  
    _maps[containerNum] = map;

  var layers = response.itemInfo.itemData.operationalLayers;


  //constrain the extent
  if (configOptions.constrainmapextent === 'true' || configOptions.constrainmapextent === true) {
    var basemapExtent = map.getLayer(map.layerIds[0]).fullExtent.expand(1.5);
    //create a graphic with a hole over the web map's extent. This hole will allow
    //the web map to appear and hides the rest of the map to limit the visible extent to the webmap.
    var clipPoly = new esri.geometry.Polygon(map.spatialReference);
    clipPoly.addRing([
      [basemapExtent.xmin, basemapExtent.ymin],
      [basemapExtent.xmin, basemapExtent.ymax],
      [basemapExtent.xmax, basemapExtent.ymax],
      [basemapExtent.xmax, basemapExtent.ymin],
      [basemapExtent.xmin, basemapExtent.ymin]
    ]);
    //counter-clockwise to add a hole
    clipPoly.addRing([
      [webmapExtent.xmin, webmapExtent.ymin],
      [webmapExtent.xmax, webmapExtent.ymin],
      [webmapExtent.xmax, webmapExtent.ymax],
      [webmapExtent.xmin, webmapExtent.ymax],
      [webmapExtent.xmin, webmapExtent.ymin]
    ]);

    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(), new dojo.Color("white"));

    var maxExtentGraphic = new esri.Graphic(clipPoly, symbol);

    map.graphics.add(maxExtentGraphic);
  }

  //add a custom logo to the map if provided
  if (configOptions.customlogo.image) {
    esri.show(dojo.byId('logo'));
    //if a link isn't provided don't make the logo clickable
    if (configOptions.customlogo.link) {
      var link = dojo.create('a', {
        href: configOptions.customlogo.link,
        target: '_blank'
      }, dojo.byId('logo'));

      dojo.create('img', {
        src: configOptions.customlogo.image
      }, link);
    } else {
      dojo.create('img', {
        id: 'logoImage',
        src: configOptions.customlogo.image
      }, dojo.byId('logo'));
      //set the cursor to the default instead of the pointer since the logo is not clickable
      dojo.style(dojo.byId('logo'), 'cursor', 'default');
    }

  }

  //initialize the geocoder
  if (configOptions.placefinder.url && location.protocol === "https:") {
    configOptions.placefinder.url = configOptions.placefinder.url.replace('http:', 'https:');
  }
  locator = new esri.tasks.Locator(configOptions.placefinder.url);
  locator.outSpatialReference = map.spatialReference;
  dojo.connect(locator, "onAddressToLocationsComplete", showResults);

  if (configOptions.displayscalebar === "true" || configOptions.displayscalebar === true) {
    //add scalebar
    var scalebar = new esri.dijit.Scalebar({
      map: map,
      scalebarUnit: 'metric'
      // scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
    });
  }

  //Add/Remove tools depending on the config settings or url parameters
  if (configOptions.displayprint === "true" || configOptions.displayprint === true) {
      addPrint(map, toolLocations[mapIdPrefix]);
  }
  if (configOptions.displaylayerlist === 'true' || configOptions.displaylayerlist === true) {
      addLayerList(layers, mapIdPrefix);
  }
  if (configOptions.displaybasemaps === 'true' || configOptions.displaybasemaps === true) {
    //add menu driven basemap gallery if embed = true
    if (configOptions.embed) {
        addBasemapGalleryMenu(toolLocations[mapIdPrefix]);
    } else {
        addBasemapGallery(toolLocations[mapIdPrefix]);
    }
  }

  if (configOptions.displaymeasure === 'true' || configOptions.displaymeasure === true) {
      addMeasurementWidget(toolLocations[mapIdPrefix]);
  } else {
    esri.hide(dojo.byId('floater'));
  }
  if (configOptions.displayelevation && configOptions.displaymeasure) {

    esri.show(dojo.byId('bottomPane'));
    createElevationProfileTools();
  }
  if (configOptions.displaybookmarks === 'true' || configOptions.displaybookmarks === true) {
    addBookmarks(response,toolLocations[mapIdPrefix]);
  }

  // Put in overview, but only on second map - both maps are sychronised, so only need one overview.
  if ((configOptions.displayoverviewmap === 'true' || configOptions.displayoverviewmap === true) && mapIdPrefix == 'map.1' ){
    //add the overview map - with initial visibility set to false.
    addOverview(false);
  }

  //do we have any editable layers - if not then set editable to false
  editLayers = hasEditableLayers(layers);
  if (editLayers.length === 0) {
    configOptions.displayeditor = false;
  }

  //do we have any operational layers - if not then set legend to false
  var layerInfo = buildLayersList(layers);
  if (layerInfo.length === 0) {
    configOptions.displaylegend = false;
  }

  //hide the left pane if editor, details and legend are all false
  if (configOptions.displayeditor === 'true' || configOptions.displayeditor === true) {
    configOptions.displayeditor = true;
  }

  if (configOptions.displaydetails === 'true' || configOptions.displaydetails === true) {
    configOptions.displaydetails = true;
  }
  if (configOptions.displaylegend === 'true' || configOptions.displaylegend === true) {
    configOptions.displaylegend = true;
  }

  if (displayLeftPanel()) {

    //create left panel (if necessary)
	var bc = dijit.byId('leftPane');
	esri.show(dojo.byId('leftPane'));
	var cp = dijit.byId('leftPaneHeader');
	if (cp == null) {
	    cp = new dijit.layout.ContentPane({
	        id: 'leftPaneHeader',
	        region: 'top',
	        style: 'height:10px;',
	        content: esri.substitute({
	            close_title: i18n.panel.close.title,
	            close_alt: i18n.panel.close.label
	        }, '<div style="float:right;clear:both;" id="paneCloseBtn"><a title=${close_title} alt=${close_alt} href="JavaScript:hideLeftPanel();"><img src=images/closepanel.png border="0"/></a></div>')
	    });
	    bc.addChild(cp);
	}
	var cp2 = dijit.byId('stackContainer');
	if (cp2 == null) {
	    cp2 = new dijit.layout.StackContainer({
	        id: 'stackContainer',
	        region: 'center',
	        style: 'height:98%;'
	    });
	    bc.addChild(cp2);
	}

	if (cp == null) {
	    cp = new dijit.layout.ContentPane({
	        id: 'leftPaneHeader',
	        region: 'top',
	        style: 'height:10px;',
	        content: esri.substitute({
	            close_title: i18n.panel.close.title,
	            close_alt: i18n.panel.close.label
	        }, '<div style="float:right;clear:both;" id="paneCloseBtn"><a title=${close_title} alt=${close_alt} href="JavaScript:hideLeftPanel();"><img src=images/closepanel.png border="0"/></a></div>')
	    });
	    bc.addChild(cp);
    }
	var cp2 = dijit.byId('stackContainer')
	if (cp2 == null) {
	    cp2 = new dijit.layout.StackContainer({
	        id: 'stackContainer',
	        region: 'center',
	        style: 'height:98%;'
	    });
	    bc.addChild(cp2);
	}

    dojo.style(dojo.byId("leftPane"), "width", configOptions.leftpanewidth + "px");

  //Add the Editor Button and Panel
  if (configOptions.displayeditor == 'true' || configOptions.displayeditor === true) {
    addEditor(editLayers); //only enabled if map contains editable layers
  }



  //Add the Detail button and panel
  if ((configOptions.displaydetails === 'true' || configOptions.displaydetails === true) && configOptions.description !== "") {

    var detailTb = new dijit.form.ToggleButton({
      showLabel: true,
      label: i18n.tools.details.label,
      title: i18n.tools.details.title,
      checked: true,
      iconClass: 'esriDetailsIcon',
      id: mapIdPrefix + 'detailButton'
    }, dojo.create('div'));
    dojo.byId('webmap-toolbar-left').appendChild(detailTb.domNode);

	dojo.connect(detailTb, 'onClick', function () {
	    navigateStack(mapIdPrefix + 'detailPanel');
    });

    var detailCp = new dijit.layout.ContentPane({
      title: i18n.tools.details.title,
      selected: true,
	  region:'center',
      id: mapIdPrefix + "detailPanel"
    });


    //set the detail info
    detailCp.set('content', configOptions.description);


    dijit.byId('stackContainer').addChild(detailCp);
    dojo.addClass(dojo.byId(mapIdPrefix + 'detailPanel'), 'panel_content');
    navigateStack('detailPanel');
  }
  if (configOptions.displaylegend == 'true' || configOptions.displaylegend === true) {
    addLegend(map, layerInfo);
  }
  if (configOptions.leftPanelVisibility == 'false' || configOptions.leftPanelVisibility === false) {
    hideLeftPanel();
  }
    dijit.byId('mainWindow').resize();
  }


  //Create the search location tool
  if (configOptions.displaysearch === 'true' || configOptions.displaysearch === true) {
      // mozilla browsers and IE see different things
      if (dojo.byId('searchWrapper') === null || dojo.byId('searchWrapper') === undefined)
        createSearchTool();
  } else {
    esri.hide(dojo.byId('webmap-toolbar-right'));
  }

  //add the time slider if the layers are time-aware
  if (configOptions.displaytimeslider === 'true' || configOptions.displaytimeslider === true) {
    if (response.itemInfo.itemData.widgets && response.itemInfo.itemData.widgets.timeSlider) {
      addTimeSlider(response.itemInfo.itemData.widgets.timeSlider.properties);
    } else {
      //check to see if we have time aware layers
      var timeLayers = hasTemporalLayer(layers);
      if (timeLayers.length > 0) {
        //do we have time aware layers? If so create time properties
        var fullExtent = getFullTimeExtent(timeLayers);
        var timeProperties = {
          'startTime': fullExtent.startTime,
          'endTime': fullExtent.endTime,
          'thumbCount': 2,
          'thumbMovingRate': 2000,
          'timeStopInterval': findDefaultTimeInterval(fullExtent)
        }
        addTimeSlider(timeProperties);
      } else {
        configOptions.displaytimeslider = false;
        esri.hide(dojo.byId('timeFloater'));
      }

    }
  }

  //Display the share dialog if enabled
  if (configOptions.displayshare === 'true' || configOptions.displayshare === true) {
    createSocialLinks();
  }

    //resize the border container
   dijit.byId('bc').resize();

    //resizeMap(); //resize the map in case any of the border elements have changed

/* ================ custom code by Rhys Donoghue at Eagle Technology Group Ltd ======================================= */

    var ValuationNo = urlParams["ValuationNo"];
    if(ValuationNo != null){
      findLocation('ValuationNumber', ValuationNo);
    }

    var GrassAreaID = urlParams["GrassAreaID"];
    if(GrassAreaID != null){
      findLocation('Cemetery', GrassAreaID);
    }

    if (configOptions.displayfullextent === 'true' || configOptions.displayfullextent === true) {
        var zoombutt = dijit.byId('zoomToFullExtent');
        if (zoombutt == null) {
            var btnZoomToFullExtent = new dijit.form.Button({
                label: "",
                id: "zoomToFullExtent",
                title: "zoom to full map extent",
                iconClass: "ZoomToFullExtent",
                onClick: function () {
                    basemapExtent = map.getLayer(map.layerIds[0]).fullExtent.expand(1.5);
                    map.setExtent(basemapExtent);
                    connectEvents(map);
                }
            });
            dojo.byId("webmap-toolbar-left").appendChild(btnZoomToFullExtent.domNode);
        }
    }

    if(configOptions.displayclearselection === 'true' || configOptions.displayclearselection === true) {
      var btnClearMap = new dijit.form.Button({
      label: "",
      id: mapIdPrefix + "ClearMap",
      title: "clear selected features",
      iconClass: "ClearMap",
      onClick: function(){
          map.graphics.clear();
          dojo.style(dojo.byId("clickOnMapTip"), "visibility", "hidden");
          }
      });
      dojo.byId(toolLocations[mapIdPrefix]).appendChild(btnClearMap.domNode);
    }

    if(configOptions.displaysplashscreen === 'true' || configOptions.displaysplashscreen === true) {
      if(getCookie('ArcGIS Online JavaScript Map Viewer') == null){
          if (jQuery.browser.mobile) {
            document.location = "mobile_disclaimer.html" + window.location.search;
          }
          else
          {
            $('#splashscreenText').html(splashscreenhtml);
            $.blockUI({ message: $('#splashscreen'), css: { 'width': '230px','height': '130px','margin-top':'-100px'}});
            $('#continue').click(function() {
               $.unblockUI();
               setCookie('ArcGIS Online JavaScript Map Viewer', '1');
              return false;
            });
          }
        }
    }

    dojo.connect(map, "onDblClick", function (evt) {
        connectEvents(response.map);
    });

    dojo.connect(map, "onMouseWheel", function (evt) {
        // CONNECT ONEXTENTCHANGE EVENT
        connectEvents(response.map);
    });
    dojo.connect(map, "onMouseDragStart", function (evt) {
        // CONNECT ONEXTENTCHANGE EVENT
        connectEvents(response.map);
    });
}

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

function setCookie(key, value) {
   var expires = new Date();
   expires.setTime(expires.getTime() + 2592000000); //30 days
   document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
   }

function getCookie(key) {
   var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
   return keyValue ? keyValue[2] : null;
   }

/* ================ custom code end ================================================================================== */

function displayLeftPanel() {
  //display the left panel if any of these options are enabled.
  var display = false;
  if (configOptions.displaydetails && configOptions.description !== '') {
    display = true;
  }
  if (configOptions.displaylegend) {
    display = true;
  }
  if (configOptions.displayeditor) {
    display = true;
  }
  return display;
}

// MAP RESIZE EVENT
function resizeMap(mapId) {
    setTimeout(function () {
        getMap(mapId).resize();
        getMap(mapId).reposition();
        }, 500);
}

// CONNECT ONEXTENTCHANGE EVENT
function connectEvents(map) {
    disconnectEvents();
    _mapExtentChangeEvent = dojo.connect(map, 'onExtentChange', function (extent, delta, levelChange, lod) {
        if (_syncScale && levelChange) {
            // SYNC SCALES
            syncMapScales(map);
        } else {
            if (_syncLocation) {
                // SYNC LOCATIN
                syncMapLocations(map);
            }
        }
        // DISCONNECT ONEXTENTCHANGE EVENT
        if (map.infoWindow.isShowing) {
            // issue with IE 10 not showing the popup after a map pan / zoom - needs to be investigated - works ok in ie 10 compat mode
        }
        disconnectEvents();
    });
}

// DISCONNECT ONEXTENTCHANGE EVENT
function disconnectEvents() {
    if (_mapExtentChangeEvent) {
        dojo.disconnect(_mapExtentChangeEvent);
    }
}

// GET CENTER OF OTHER MAP BASED ON THIS MAP
function getCenter(thisMap, otherMap, callback) {
    if (thisMap.spatialReference.wkid === otherMap.spatialReference.wkid) {
        if (callback) {
            callback(thisMap.extent.getCenter());
        }
    } else if (isWebMercator(thisMap.spatialReference) && isWebMercator(otherMap.spatialReference)) {
        if (callback) {
            callback(thisMap.extent.getCenter());
        }
    } else {
        var geomSrv = new esri.tasks.GeometryService(userConfig.geometryServiceURL);
        geomSrv.project([thisMap.extent.getCenter()], otherMap.spatialReference, function (projectedGeoms) {
            if (callback) {
                callback(projectedGeoms[0]);
            }
        });
    }
}


// GET MAP BASED ON MAP ID
function getMap(mapId) {
    return dojo.filter(_maps, function (map) {
        return (map.id === mapId);
    })[0];
}

// GET MAP SCALE
function getMapScale(map) {
    return esri.geometry.getScale(map);
}

// GET MAP LEVEL BASED ON SCALE
function getMapLevelByScale(map, mapScale) {
    var nearLODs = dojo.filter(map.__tileInfo.lods, function (lod) {
        return (parseInt(lod.scale, 10) <= parseInt(mapScale, 10));
    });
    if (nearLODs.length > 0) {
        return nearLODs[0].level;
    } else {
        return null;
    }
}

// SYNC MAP SCALES
function syncMapScales(thisMap) {
    dojo.forEach(_maps, function (otherMap) {
        if (otherMap.id !== thisMap.id) {
          otherMap.setExtent(thisMap.extent);
        }
    });
}

// SYNC MAP LOCATIONS
function syncMapLocations(thisMap) {
    dojo.forEach(_maps, function (otherMap) {
        if (otherMap.id !== thisMap.id) {
            getCenter(thisMap, otherMap, function (otherCenter) {
                otherMap.centerAt(otherCenter);
            });
        }
    });
}

//Remove at 2.9
function adjustPopupSize() {
  var box = dojo.contentBox(map.container);

  var width = 270, height = 300, // defaults
      newWidth = Math.round(box.w * 0.60),
      newHeight = Math.round(box.h * 0.45);
  if (newWidth < width) {
    width = newWidth;
  }

  if (newHeight < height) {
    height = newHeight;
  }

  map.infoWindow.resize(width, height);
}

//select panels in the stack container. The stack container is used to organize content
//in the left panel (editor, legend, details)
function navigateStack(label) {
  //display the left panel if its hidden
  showLeftPanel();

  //select the appropriate container
  dijit.byId('stackContainer').selectChild(label);

  //hide or show the editor
  if (label === 'editPanel') {
    createEditor();
  } else {
    destroyEditor();
  }

  //toggle the other buttons
  var buttonLabel = '';
  switch (label) {
  case 'editPanel':
    buttonLabel = 'editButton';
    break;
  case 'legendPanel':
    buttonLabel = 'legendButton';
    break;
  case 'detailPanel':
    buttonLabel = 'detailButton';
    break;
  }
  toggleToolbarButtons(buttonLabel);

}

/* ================ custom code by Rhys Donoghue at Eagle Technology Group Ltd ======================================= */

 function initSearch() {
        //create find task with url to map service
        findTask = new esri.tasks.FindTask("http://gisviewer-qa.hcc.govt.nz/arcgis/rest/services/AGOL_Property/PropertyInformation/MapServer");
        findTaskCemetery = new esri.tasks.FindTask("http://gisviewer-qa.hcc.govt.nz/arcgis/rest/services/AGOL_Cemetery/Cemetery/MapServer");


        //create find parameters and define known values
        findParams = new esri.tasks.FindParameters();
        findParams.returnGeometry = true;
        findParams.contains = false;
        findParams.layerIds = [1];
        findParams.searchFields = ["Street_Address"];
 };

//use the locator to find the input location
function findLocation(searchType, searchStr) {

  if (searchStr == '') {
    $("#SearchDialog").html('<p>Please enter your search criteria and click the search button.</p>');
    $("#SearchDialog").dialog({
            autoOpen: true,
            modal: true,
            height: "120",
            width: "220",
            position: 'center',
            resizable: false
        });
  }
  else {

        switch (searchType) {
        case 'Address':
          findParams.layerIds = [0];
          findParams.searchFields = ["Street_Address"];
          findParams.searchText = searchStr;
          findTask.execute(findParams, showResults);
          break;
        case 'PlanNumber':
          findParams.layerIds = [0];
          findParams.searchFields = ["PlanNo"];
          findParams.searchText = searchStr;
          findTask.execute(findParams, showResults);
          break;
        case 'ValuationNumber':
          findParams.layerIds = [0];
          findParams.searchFields = ["Valuation_number"];
          findParams.searchText = searchStr;
          findTask.execute(findParams, showResults);
          break;
        case 'Roadname':
          findParams.returnGeometry = true;
          findParams.contains = false;
          findParams.layerIds = [1];
          findParams.searchFields = ["ROAD_NAME"];
          findParams.searchText = searchStr;
          findTask.execute(findParams, showResults);
          break;
        case 'Cemetery':
          findParams.returnGeometry = true;
          findParams.contains = false;
          findParams.layerIds = [0];
          findParams.searchFields = ["GrassAreaID"];
          findParams.searchText = searchStr;
          findTaskCemetery.execute(findParams, showResults);
          break;
        }

  }


    /*
      var address = {};
      address[configOptions.placefinder.singlelinefieldname] = searchText;

      var options = {
        address: address,
        outFields: ["*"]
      };

      locator.addressToLocations(options);
    */
}
//display the location results on the map

function showResults(results) {

 try {

       if (_maps[0].infoWindow.isShowing) {
           _maps[0].infoWindow.clearFeatures();
           _maps[0].infoWindow.hide();
       }

       if (_maps[1].infoWindow.isShowing) {
           _maps[1].infoWindow.clearFeatures();
           _maps[1].infoWindow.hide();
       }

       _maps[0].graphics.clear();
       _maps[1].graphics.clear();

        var markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 1), new dojo.Color([0,255,0,0.25]));
        var polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([255,255,0,0.25]));
        var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2);

        var ResultExtent;

        var items = dojo.map(results,function(result){
          graphic = result.feature;

          switch (graphic.geometry.type) {
            case "point":
              graphic.setSymbol(markerSymbol);
              break;
            case "polyline":
              graphic.setSymbol(lineSymbol);
              break;
            case "polygon":
              graphic.setSymbol(polygonSymbol);
              break;
          }

          if(!ResultExtent) {
            ResultExtent = graphic.geometry.getExtent()
          }
          else
          {
            ResultExtent = ResultExtent.union(graphic.geometry.getExtent());
          }

          var graphic2 = jQuery.extend({}, graphic);
          _maps[0].graphics.add(graphic);
          _maps[1].graphics.add(graphic2);

          return result.feature.attributes;
        });

           ResultExtent = ResultExtent.getExtent().expand(2);
           _maps[0].setExtent(ResultExtent);
           _maps[1].setExtent(ResultExtent);
           $('#clickOnMapTip').css({ visibility: 'visible' });

        } catch(err){

            $("#SearchDialog").html('<p>No results found.  Please try again.</p>');
            $("#SearchDialog").dialog({
                    autoOpen: true,
                    modal: true,
                    height: "120",
                    width: "220",
                    position: 'center',
                    resizable: false
              });

          return false;
        }

      };
/* ================ custom code end ================================================================================== */


//display the location results on the map
/*
function showResults(candidates) {
  var candidate;
  var geom;
  //hide the info window if displayed
  if (map.infoWindow.isShowing) {
    map.infoWindow.clearFeatures();
    map.infoWindow.hide();
  }
  var zoomExtent;
  dojo.every(candidates, function (candidate) {
    if (candidate.score > 80) {
      geom = candidate.location;
      map.infoWindow.setTitle(i18n.tools.search.title);
      map.infoWindow.setContent(candidate.address);
      map.infoWindow.show(geom);
      zoomExtent = new esri.geometry.Extent(candidate.attributes.West_Lon, candidate.attributes.South_Lat, candidate.attributes.East_Lon, candidate.attributes.North_Lat, new esri.SpatialReference({
        wkid: 4326
      }));
      return false; //break out of loop after one candidate with score greater  than 80 is found.
    }
  });
  if (geom !== undefined) {
    //if the extent is constrained check to see if geocode result is within extent.If it is then zoom otherwise don't.
    if ((configOptions.constrainmapextent === 'true' || configOptions.constrainmapextent === true) && !webmapExtent.contains(geom)) {
      dojo.byId('searchField').value = i18n.tools.search.errors.missingLocation;
      map.infoWindow.hide();
    } else {
      map.setExtent(esri.geometry.geographicToWebMercator(zoomExtent));
    }
  } else {
    //no matches found
    dojo.byId('searchField').value = i18n.tools.search.errors.missingLocation;
  }
}

*/

//Utility functions that handles showing and hiding the left panel. Hide occurs when
//the x (close) button is clicked.
function showLeftPanel() {
  //display the left panel if hidden
  var leftPaneWidth = dojo.style(dojo.byId("leftPane"), "width");
  if (leftPaneWidth === 0) {
      dojo.style(dojo.byId("leftPane"), "width", configOptions.leftpanewidth + "px");
    dijit.byId("mainWindow").resize();
  }
}

function hideLeftPanel() {
  //close the left panel when x button is clicked
  var leftPaneWidth = dojo.style(dojo.byId("leftPane"), "width");
  if (leftPaneWidth === 0) {
    leftPaneWidth = configOptions.leftpanewidth;
  }
  dojo.style(dojo.byId("leftPane"), "width", "0px");
  dijit.byId('mainWindow').resize();

  //uncheck the edit, detail and legend buttons
  setTimeout(function () {
    toggleToolbarButtons('');

  }, 100);

}

function toggleToolbarButtons(label) {
  var buttons = ['detailButton', 'editButton', 'legendButton'];
  dojo.forEach(buttons, function (button) {
    if (dijit.byId(button)) {
      if (button === label) {
        dijit.byId(label).set('checked', true);
      } else {
        dijit.byId(button).set('checked', false);
      }
    }
  });

}

//Create links for sharing the app via social networking use bitly to shorten the url
function updateLinkUrls() {
  //get the current map extent
  var extent = "";
  extent = "&extent=" + dojo.toJson(map.extent.toJson());

  var appUrl = (document.location.href.split("?"));
  var link = appUrl[0] + "?" + extent;
  if (appUrl[1]) {
    link += "&" + appUrl[1];
  }

  var mapTitle = "Web Map";
  if (dojo.byId("webmapTitle")) {
    mapTitle = encodeURIComponent(dojo.byId("webmapTitle").innerHTML);
  }

  if (configOptions.bitly.key && configOptions.bitly.login) {
    var url = "http://api.bit.ly/v3/shorten?" + "login=" + configOptions.bitly.login + "&apiKey=" + configOptions.bitly.key + "&longUrl=" + encodeURIComponent(link) + "&format=json";
    esri.request({
      url: url,
      handleAs: "json",
      callbackParamName: "callback",
      load: function (results) {
        createLink(mapTitle, results.data.url);
      },
      error: function (e) {
        alert(i18n.viewer.errors.general + ":" + dojo.toJson(error.message));
      }
    });
  } else {
    //no bitly key provided use long url
    var url = encodeURIComponent(link);
    createLink(mapTitle, url);
  }
}

function createLink(mapTitle, url) {
  dojo.byId('mailLink').href = "mailto:?subject=" + mapTitle + "&body=Check out this map: %0D%0A " + url;
  dojo.byId('facebookLink').href = "http://www.facebook.com/sharer.php?u=" + url + "&t=" + mapTitle;
  dojo.byId('twitterLink').href = "http://www.twitter.com/home?status=" + mapTitle + "+" + url;
}

function addBasemapGalleryMenu(location) {
  //This option is used for embedded maps so the gallery fits well with apps of smaller sizes.
  var basemapGroup = null;
  if (configOptions.basemapgroup.title && configOptions.basemapgroup.owner) {
    basemapGroup = {
      "owner": configOptions.basemapgroup.owner,
      "title": configOptions.basemapgroup.title
    }
  }

  var ht = map.height / 2;
  var cp = new dijit.layout.ContentPane({
    id: 'basemapGallery',
    style: "height:" + ht + "px;width:190px;"
  });



  var basemapMenu = new dijit.Menu({
    id: 'basemapMenu'
  });

  //if a bing maps key is provided - display bing maps too.
  var basemapGallery = new esri.dijit.BasemapGallery({
    showArcGISBasemaps: true,
    basemapsGroup: basemapGroup,
    bingMapsKey: configOptions.bingmapskey,
    map: map
  });
  cp.set('content', basemapMenu.domNode);
  dojo.connect(basemapGallery, 'onLoad', function () {
    dojo.forEach(basemapGallery.basemaps, function (basemap) {
      //Add a menu item for each basemap, when the menu items are selected
      dijit.byId('basemapMenu').addChild(new myModules.custommenu({
        label: basemap.title,
        icon: basemap.thumbnailUrl,
        onClick: function () {
          basemapGallery.select(basemap.id);
        }
      }));

    });
  });




  var button = new dijit.form.DropDownButton({
    label: i18n.tools.basemap.label,
    id: "basemapBtn",
    iconClass: "esriBasemapIcon",
    title: i18n.tools.basemap.title,
    dropDown: cp
  });

  dojo.byId(location).appendChild(button.domNode);

  dojo.connect(basemapGallery, "onSelectionChange", function () {
    //close the basemap window when an item is selected
    //destroy and recreate the overview map  - so the basemap layer is modified.
    destroyOverview();
    dijit.byId('basemapBtn').closeDropDown();
  });

  basemapGallery.startup();
}


//Add the basemap gallery widget to the application.
function addBasemapGallery(location) {
  //if a basemap group was specified listen for the callback and modify the query
  var basemapGroup = null;
  if (configOptions.basemapgroup.title && configOptions.basemapgroup.owner) {
    basemapGroup = {
      "owner": configOptions.basemapgroup.owner,
      "title": configOptions.basemapgroup.title
    }
  }
  var cp = new dijit.layout.ContentPane({
    id: 'basemapGallery',
    style: "max-height:448px;width:auto;max-width:380px;"
  });

  //if a bing maps key is provided - display bing maps too.
  var basemapGallery = new esri.dijit.BasemapGallery({
    showArcGISBasemaps: true,
    basemapsGroup: basemapGroup,
    bingMapsKey: configOptions.bingmapskey,
    map: map
  }, dojo.create('div'));


  cp.set('content', basemapGallery.domNode);


  var button = new dijit.form.DropDownButton({
    label: i18n.tools.basemap.label,
    id: "basemapBtn",
    iconClass: "esriBasemapIcon",
    title: i18n.tools.basemap.title,
    dropDown: cp
  });

  dojo.byId(location).appendChild(button.domNode);

  dojo.connect(basemapGallery, "onSelectionChange", function () {
    //close the basemap window when an item is selected
    //destroy and recreate the overview map  - so the basemap layer is modified.
    destroyOverview();
    dijit.byId('basemapBtn').closeDropDown();
  });

  basemapGallery.startup();
}

//add any bookmarks to the application
function addBookmarks(info,location) {
  //does the web map have any bookmarks
  if (info.itemInfo.itemData.bookmarks) {
    var bookmarks = new esri.dijit.Bookmarks({
      map: map,
      bookmarks: info.itemInfo.itemData.bookmarks
    }, dojo.create("div"));


    dojo.connect(bookmarks, "onClick", function () {
      //close the bookmark window when an item is clicked
      dijit.byId('bookmarkButton').closeDropDown();
    });


    var cp = new dijit.layout.ContentPane({
      id: 'bookmarkView'
    });
    cp.set('content', bookmarks.bookmarkDomNode);
    var button = new dijit.form.DropDownButton({
      label: i18n.tools.bookmark.label,
      id: "bookmarkButton",
      iconClass: "esriBookmarkIcon",
      title: i18n.tools.bookmark.title,
      dropDown: cp
    });

    dojo.byId(location).appendChild(button.domNode);
  }

}
//Create a menu with a list of operational layers. Each menu item contains a check box
//that allows users to toggle layer visibility.
function addLayerList(layers, mapIdPrefix) {
  var layerList = buildLayerVisibleList(layers);

  if (layerList.length > 0) {
    //create a menu of layers
    layerList.reverse();
    var menu = new dijit.Menu({
        id: mapIdPrefix + 'layerMenu'
    });
    dojo.forEach(layerList, function (layer) {
      menu.addChild(new dijit.CheckedMenuItem({
        label: layer.title,
        checked: layer.visible,
        onChange: function () {
          if (layer.layer.featureCollection) {
            //turn off all the layers in the feature collection even
            //though only the  main layer is listed in the layer list
            dojo.forEach(layer.layer.featureCollection.layers, function (layer) {
              layer.layerObject.setVisibility(!layer.layerObject.visible);
            });
          } else {
            layer.layer.setVisibility(!layer.layer.visible);
          }

        }
      }));
    });


    var button = new dijit.form.DropDownButton({
      label: i18n.tools.layers.label,
      id: mapIdPrefix + "layerBtn",
      iconClass: "esriLayerIcon",
      title: i18n.tools.layers.title,
      dropDown: menu
    });

    dojo.byId(toolLocations[mapIdPrefix]).appendChild(button.domNode);
  }
}

//build a list of layers for the toggle layer list - this list
//is slightly different than the legend because we don't want to list lines,points,areas etc for each
//feature collection type.
function buildLayerVisibleList(layers) {
  var layerInfos = [];
  dojo.forEach(layers, function (mapLayer, index) {
    if (mapLayer.featureCollection && !mapLayer.layerObject) {
      if (mapLayer.featureCollection.layers) {
        //add the first layer in the layer collection... not all  - when we turn off the layers we'll
        //turn them all off
        if (mapLayer.featureCollection.layers) {
          layerInfos.push({
            "layer": mapLayer,
            "visible": mapLayer.visibility,
            "title": mapLayer.title
          });
        }
      }
    } else if (mapLayer.layerObject) {
      layerInfos.push({
        layer: mapLayer.layerObject,
        visible: mapLayer.layerObject.visible,
        title: mapLayer.title
      });
    }
  });
  return layerInfos;
}

function addPrint(map,location) {
    var layoutOptions ={
    'authorText':configOptions.owner,
    'titleText': configOptions.title,
    'scalebarUnit': (i18n.viewer.main.scaleBarUnits === 'Kilometers') ? 'Miles' : 'Kilometers',
    //'scalebarUnit': (i18n.viewer.main.scaleBarUnits === 'english') ? 'Miles' : 'Kilometers',
    'legendLayers':[]
    };

    var templates = dojo.map(configOptions.printlayouts,function(layout){
    layout.layoutOptions = layoutOptions;
    return layout;
    });
    // print dijit
    var printer = new esri.dijit.Print({
      map: map,
      templates: templates,
      url: configOptions.printtask
    },dojo.create('span'));

    dojo.query('.esriPrint').addClass('esriPrint');

    dojo.byId(location).appendChild(printer.printDomNode);

    printer.startup();
}

//create a floating pane to hold the measure widget and add a button to the toolbar
//that allows users to hide/show the measurement widget.
function addMeasurementWidget(location) {
  var fp = new dojox.layout.FloatingPane({
    title: i18n.tools.measure.title,
    resizable: false,
    dockable: false,
    closable: false,
    style: "position:absolute;top:0;left:50px;width:245px;height:175px;z-index:100;visibility:hidden;",
    id: 'floater'
  }, dojo.byId('floater'));
  fp.startup();

  var titlePane = dojo.query('#floater .dojoxFloatingPaneTitle')[0];
  //add close button to title pane
  var closeDiv = dojo.create('div', {
    id: "closeBtn",
    innerHTML: esri.substitute({
      close_title: i18n.panel.close.title,
      close_alt: i18n.panel.close.label
    }, '<a alt=${close_alt} title=${close_title} href="JavaScript:toggleMeasure();"><img  src="images/close.png"/></a>')
  }, titlePane);

  measure = new esri.dijit.Measurement({
    map: map,
    id: 'measureTool'
  }, 'measureDiv');

  measure.startup();


  var toggleButton = new dijit.form.ToggleButton({
    label: i18n.tools.measure.label,
    title: i18n.tools.measure.title,
    id: "toggleButton",
    iconClass: "esriMeasureIcon"
  });

  dojo.connect(toggleButton, "onClick", function () {
    toggleMeasure();
  });

  dojo.byId(location).appendChild(toggleButton.domNode);
}

//Show/hide the measure widget when the measure button is clicked.
function toggleMeasure() {
  if (dojo.byId('floater').style.visibility === 'hidden') {
    dijit.byId('floater').show();
    disablePopups(); //disable map popups otherwise they interfere with measure clicks
  } else {
    dijit.byId('floater').hide();
    enablePopups(); //enable map popup windows
    dijit.byId('toggleButton').set('checked', false); //uncheck the measure toggle button
    //deactivate the tool and clear the results
    var measure = dijit.byId('measureTool');
    measure.clearResult();
    if (measure.activeTool) {
      measure.setTool(measure.activeTool, false);
    }
  }

}

function addOverview(isVisible) {
  //attachTo:bottom-right,bottom-left,top-right,top-left
  //opacity: opacity of the extent rectangle - values between 0 and 1.
  //color: fill color of the extnet rectangle
  //maximizeButton: When true the maximize button is displayed
  //expand factor: The ratio between the size of the ov map and the extent rectangle.
  //visible: specify the initial visibility of the ovmap.
  var overviewMapDijit = new esri.dijit.OverviewMap({
    map: _maps[1],
    attachTo: "top-right",
    opacity: 0.5,
    color: "#000000",
    expandfactor: 2,
    maximizeButton: false,
    visible: isVisible,
    id: 'overviewMap'
  });
  overviewMapDijit.startup();
}

function destroyOverview() {
  var ov = dijit.byId('overviewMap');
  if (ov) {
    var vis = ov.visible;
    ov.destroy();
    addOverview(vis);
  }
}

//Add the legend to the application - the legend will be
//added to the left panel of the application.
function addLegend(map, layerInfo) {
    var legendTb = dijit.byId('legendButton');
    if (legendTb == null) {
        legendTb = new dijit.form.ToggleButton({
            showLabel: true,
            label: i18n.tools.legend.label,
            title: i18n.tools.legend.title,
            checked: true,
            iconClass: 'esriLegendIcon',
            id: 'legendButton'
        }, dojo.create('div'));

        dojo.byId('webmap-toolbar-left').appendChild(legendTb.domNode);

        dojo.connect(legendTb, 'onClick', function () {
            navigateStack('legendPanel');
        });
    }

    var legendCp = dijit.byId('legendPanel');
    if (legendCp == null) {
        legendCp = new dijit.layout.ContentPane({
            title: i18n.tools.legend.title,
            selected: true,
            region: 'center',
            id: "legendPanel"
        });

        dijit.byId('stackContainer').addChild(legendCp);
        dojo.addClass(dojo.byId('legendPanel'), 'panel_content');
    }

    var legendDijit = new esri.dijit.Legend({
        map: map,
        layerInfos: layerInfo
    }, dojo.create('div'));

    dojo.byId('legendPanel').appendChild(legendDijit.domNode);
    legendDijit.startup();
    navigateStack('legendPanel');


}

//build a list of layers to display in the legend
  function buildLayersList(layers){

 //layers  arg is  response.itemInfo.itemData.operationalLayers;
  var layerInfos = [];
  dojo.forEach(layers, function (mapLayer, index) {
      var layerInfo = {};
      if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
        if (mapLayer.featureCollection.showLegend === true) {
            dojo.forEach(mapLayer.featureCollection.layers, function (fcMapLayer) {
              if (fcMapLayer.showLegend !== false) {
                  layerInfo = {
                      "layer": fcMapLayer.layerObject,
                      "title": mapLayer.title,
                      "defaultSymbol": false
                  };
                  if (mapLayer.featureCollection.layers.length > 1) {
                      layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
                  }
                  layerInfos.push(layerInfo);
              }
            });
          }
      } else if (mapLayer.showLegend !== false && mapLayer.layerObject) {
      var showDefaultSymbol = false;
      if (mapLayer.layerObject.version < 10.1 && (mapLayer.layerObject instanceof esri.layers.ArcGISDynamicMapServiceLayer || mapLayer.layerObject instanceof esri.layers.ArcGISTiledMapServiceLayer)) {
        showDefaultSymbol = true;
      }
      layerInfo = {
        "layer": mapLayer.layerObject,
        "title": mapLayer.title,
        "defaultSymbol": showDefaultSymbol
      };
        //does it have layers too? If so check to see if showLegend is false
        if (mapLayer.layers) {
            var hideLayers = dojo.map(dojo.filter(mapLayer.layers, function (lyr) {
                return (lyr.showLegend === false);
            }), function (lyr) {
                return lyr.id;
            });
            if (hideLayers.length) {
                layerInfo.hideLayers = hideLayers;
            }
        }
        layerInfos.push(layerInfo);
    }
  });
  return layerInfos;
  }



//Determine if the webmap has any editable layers
function hasEditableLayers(layers) {
  var layerInfos = [];
  dojo.forEach(layers, function (mapLayer, index) {
    if (mapLayer.layerObject) {
      if (mapLayer.layerObject.isEditable) {
        if (mapLayer.layerObject.isEditable()) {
          layerInfos.push({
            'featureLayer': mapLayer.layerObject
          });
        }
      }
    }
  });
  return layerInfos;
}



//if the webmap contains editable layers add an editor button to the map
//that adds basic editing capability to the app.
function addEditor(editLayers) {

  //create the button that show/hides the editor
  var editTb = new dijit.form.ToggleButton({
    showLabel: true,
    label: i18n.tools.editor.label,
    title: i18n.tools.editor.title,
    checked: false,
    iconClass: 'esriEditIcon',
    id: 'editButton'
  }, dojo.create('div'));

  //add the editor button to the left side of the application toolbar
  dojo.byId('webmap-toolbar-left').appendChild(editTb.domNode);
  dojo.connect(editTb, 'onClick', function () {
    navigateStack('editPanel');
  });

  //create the content pane that holds the editor widget
  var editCp = new dijit.layout.ContentPane({
    title: i18n.tools.editor.title,
    selected: "true",
    id: "editPanel",
	region: "center"
  });

  //add this to the existing div
  dijit.byId('stackContainer').addChild(editCp);
  navigateStack('editPanel');
  //create the editor if the legend and details panels are hidden - otherwise the editor
  //will be created when the edit button is clicked.
  if ((configOptions.displaydetails === false || configOptions.displaydetails === 'false') && (configOptions.displaylegend === false || configOptions.displaylegend === 'false')) {
    createEditor();
  }
}

//Functions to create and destroy the editor. We do this each time the edit button is clicked.
function createEditor() {

  if (editorWidget) {
    return;
  }
  if (editLayers.length > 0) {
    //create template picker
    var templateLayers = dojo.map(editLayers, function (layer) {
      return layer.featureLayer;
    });

    var eDiv = dojo.create("div", {
      id: "editDiv"
    });
    dojo.byId('editPanel').appendChild(eDiv);
    var editLayerInfo = editLayers;

    var templatePicker = new esri.dijit.editing.TemplatePicker({
      featureLayers: templateLayers,
      rows: 'auto',
      columns:'auto',
	  grouping:true,
	  showTooltip:false,
      style: 'height:98%;width:'+ (configOptions.leftpanewidth-4) + 'px;'
    }, 'editDiv');
    templatePicker.startup();

    var settings = {
      map: map,
      templatePicker: templatePicker,
      layerInfos: editLayerInfo,
      toolbarVisible: false
    };
    var params = {
      settings: settings
    };
    editorWidget = new esri.dijit.editing.Editor(params);
    editorWidget.startup();

    disablePopups();
  }

}

function destroyEditor() {
  if (editorWidget) {
    editorWidget.destroy();
    editorWidget = null;
    enablePopups();
  }

}
//Utility methods used to enable/disable popups. For example when users are measuring locations
//on the map we want to turn popups off so they don't appear when users click to specify a measure area.
function enablePopups() {
  if (clickListener) {
    clickHandler = dojo.connect(map, "onClick", clickListener);
  }
}

function disablePopups() {
  if (clickHandler) {
    dojo.disconnect(clickHandler);
  }
}

//Create menu of social network sharing options (Email, Twitter, Facebook)
function createSocialLinks() {
  //extend the menu item so the </a> links are clickable
  dojo.provide('dijit.anchorMenuItem');

  dojo.declare('dijit.anchorMenuItem', dijit.MenuItem, {
    _onClick: function (evt) {
      this.firstChild.click(this, evt);
    }
  });
  //create a dropdown button to display the menu
  //build a menu with a list of sharing options
  var menu = new dijit.Menu({
    id: 'socialMenu',
    style: 'display:none;'
  });

  menu.addChild(new dijit.anchorMenuItem({
    label: esri.substitute({
      email_text: i18n.tools.share.menu.email.label
    }, "<a id='mailLink' target='_blank' class='iconLink'>${email_text}</a>"),
    iconClass: "emailIcon"
  }));
  menu.addChild(new dijit.anchorMenuItem({
    label: esri.substitute({
      facebook_text: i18n.tools.share.menu.facebook.label
    }, "<a id='facebookLink' target='_blank' class='iconLink'>${facebook_text}</a>"),
    iconClass: "facebookIcon"
  }));
  menu.addChild(new dijit.anchorMenuItem({
    label: esri.substitute({
      twitter_text: i18n.tools.share.menu.twitter.label
    }, "<a id='twitterLink' target='_blank' class='iconLink'>${twitter_text}</a>"),
    iconClass: "twitterIcon"
  }));
  //create dropdown button to display menu
  var menuButton = new dijit.form.DropDownButton({
    label: i18n.tools.share.label,
    id: 'shareButton',
    title: i18n.tools.share.title,
    dropDown: menu,
    iconClass: 'esriLinkIcon'
  });
  dojo.connect(menuButton, 'onClick', function () {
    updateLinkUrls();
  });
  dojo.byId('webmap-toolbar-center').appendChild(menuButton.domNode);

}


//Tool that allows users to search for an address or place.
//This tool uses a single line address locator.
function createSearchTool() {
  //add the toolbar section that holds the search tool
  var wrapperDiv = dojo.create('div', {
    id: 'searchWrapper'
  }, dojo.byId('webmap-toolbar-right'));
  dojo.addClass('searchWrapper', 'searchwrapper');

/* ================ custom code by Rhys Donoghue at Eagle Technology Group Ltd ======================================= */
  if (dojo.byId('ddlsearch') === null || dojo.byId('ddlsearch') === undefined) {
      //stop this control from being created twice
      var searchDropdownDiv = dojo.create('div', {
          id: 'searchDropdownDiv',
          innerHTML: "<select id='ddlsearch' onchange='updateTypeAhead();'><option value='Address' selected='selected'>Address</option><option value='PlanNumber'>Plan No.</option><option value='ValuationNumber'>Valuation No.</option><option value='Roadname'>Road Name</option></select>"
      }, wrapperDiv);
      dojo.addClass(dojo.byId('searchDropdownDiv'), 'searchdropdown');
  }
/* ================ custom code end ================================================================================== */

  /* TODO not working, values not showing in dropdown - would prefer to use dojo than HTML dropdown as above.
   var searchDD = dojo.create('select', {
    id: 'searchdrop',
     options: [
      { label: 'Address', value: 'Address', selected: true },
      { label: 'Road', value: 'Road' },
      { label: 'Placename', value: 'Placename' }
    ]
  }, wrapperDiv);
  dojo.addClass(dojo.byId('searchdrop'), 'searchdropdown');
    */

 /*
  var searchInput = dojo.create('input', {
    id: 'searchField',
    type: 'text',
    placeholder: 'Find an address', //i18n.tools.search.title,
    onkeydown: function (e) {
      if (e.keyCode === 13) {
        findLocation();
      }
    }
  }, wrapperDiv);
  dojo.addClass(dojo.byId('searchField'), 'searchbox');
  */

/* ================ custom code by Rhys Donoghue at Eagle Technology Group Ltd ======================================= */

  $(function () {
      // IE and mozilla return different results to null and undefined  
      if (dojo.byId('searchField') === null || dojo.byId('searchField') === undefined) {
          setSearchValue();

          var searchInput = dojo.create('input', {
              id: 'searchField',
              type: 'text',
              placeholder: '-', //i18n.tools.search.title,
              onkeydown: function (e) {
                  if (e.keyCode === 13) {
                      findLocation(ddlsearchValue, this.value);
                  }
              }
          }, wrapperDiv);
          dojo.addClass(dojo.byId('searchField'), 'searchbox');

          updateTypeAhead(); //initialize Type Ahead
      }
  });
      /* ================ custom code end ================================================================================== */

      dojo.create('input', {
          type: 'image',
          id: 'blankImage',
          src: 'images/blank.gif'
      }, wrapperDiv);
      dojo.connect(dojo.byId('blankImage'), 'onclick', function () {
          searchStr = dojo.byId('searchField').value;
          findLocation(ddlsearchValue, searchStr); // custom code by Rhys
      });
      dojo.addClass(dojo.byId('blankImage'), 'searchbutton');

      //add placeholder for browsers that don't support (IE)
      if (!supportsPlaceholder()) {
          var search = dojo.byId("searchField");
          var text_content = i18n.tools.search.title;

          search.style.color = "gray";
          search.value = text_content;

          search.onfocus = function () {
              if (this.style.color === "gray") {
                  this.value = "";
                  this.style.color = "black";
              }
          };

          search.onblur = function () {
              if (this.value === "") {
                  this.style.color = "gray";
                  this.value = text_content;
              }
          };
      }
}

/* ================ custom code by Rhys Donoghue at Eagle Technology Group Ltd ======================================= */

function setSearchValue () {
  searchvalue = document.getElementById("ddlsearch");
  ddlsearchValue = searchvalue.options[searchvalue.selectedIndex].value;
  $("#searchField").val("");
}

function updateTypeAhead() {

 setSearchValue();

  switch(ddlsearchValue) {
      case 'Address':
        dojo.byId('searchField').placeholder = "search for an address";
        break;
      case 'PlanNumber':
        dojo.byId('searchField').placeholder = "search for a plan";
        break;
      case 'ValuationNumber':
        dojo.byId('searchField').placeholder = "search for a valuation number";
        break;
      case 'Roadname':
        dojo.byId('searchField').placeholder = "search for a road";
        break;
  }

 $("#searchField").autocomplete({
	            source: function (request, response) {
	                $.ajax({
	                    url: "http://gisviewer-qa.hcc.govt.nz/WebServices/TypeAhead/searchJSON.ashx",//"http://s1-hcc.cloud.eaglegis.co.nz/WebServices/TypeAhead/searchJSON.ashx",
	                    dataType: "jsonp",
	                    data: {
	                        searchType: ddlsearchValue,
	                        //style: "full",
	                        maxRows: 10,
	                        searchTerm: request.term
	                    },
	                    success: function (data) {
	                        response($.map(data.results, function (item) {
	                            return {
	                                label: item.name,
	                                value: item.name
	                            }
	                        }));
	                    },
	                    error: function (err) {
	                        console.debug(err);
	                    }
	                });
	            },
	            minLength: 2
	        });
}
/* ================ custom code end ================================================================================== */


//determine if the browser supports HTML5 input placeholder
function supportsPlaceholder() {
  var i = document.createElement('input');
  return 'placeholder' in i;
}


//Add the time slider if the webmap has time-aware layers
function addTimeSlider(timeProperties) {
  esri.show(dojo.byId('timeFloater'));
  //add time button and create floating panel
  var fp = new dojox.layout.FloatingPane({
    title: i18n.tools.time.title,
    resizable: false,
    dockable: false,
    closable: false,
    style: "position:absolute;bottom:10px;left:10px;width:80%;height:150px;z-index:100;visibility:hidden;",
    id: 'timeFloater'
  }, dojo.byId('timeFloater'));
  fp.startup();


  //add close button to title pane
  var titlePane = dojo.query('#timeFloater .dojoxFloatingPaneTitle')[0];
  var closeDiv = dojo.create('div', {
    id: "closeBtn",
    innerHTML: esri.substitute({
      close_title: i18n.panel.close.title,
      close_alt: i18n.panel.close.label
    }, '<a alt=${close_alt} title=${close_title} href="JavaScript:toggleTime(null);"><img  src="images/close.png"/></a>')
  }, titlePane);


  //add a button to the toolbar to toggle the time display
  var toggleButton = new dijit.form.ToggleButton({
    label: i18n.tools.time.label,
    title: i18n.tools.time.title,
    id: "toggleTimeButton",
    iconClass: "esriTimeIcon"
  });

  dojo.connect(toggleButton, "onClick", function () {
    toggleTime(timeProperties);
  });

  dojo.byId('webmap-toolbar-center').appendChild(toggleButton.domNode);


}

function formatDate(date, datePattern) {
  return dojo.date.locale.format(date, {
    selector: 'date',
    datePattern: datePattern
  });
}

function hasTemporalLayer(layers) {
  var timeLayers = [];
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    if (layer.layerObject) {
      if (layer.layerObject.timeInfo && layer.layerObject.visible) {
        timeLayers.push(layer.layerObject);
      }
    }
  }
  return timeLayers;
}

function getFullTimeExtent(timeLayers) {
  var fullTimeExtent = null;
  dojo.forEach(timeLayers, function (layer) {
    var timeExtent = layer.timeInfo.timeExtent;
    if (!fullTimeExtent) {
      fullTimeExtent = new esri.TimeExtent(new Date(timeExtent.startTime.getTime()), new Date(timeExtent.endTime.getTime()));
    } else {
      if (fullTimeExtent.startTime > timeExtent.startTime) {
        fullTimeExtent.startTime = new Date(timeExtent.startTime.getTime());
      }
      if (fullTimeExtent.endTime < timeExtent.endTime) {
        fullTimeExtent.endTime = new Date(timeExtent.endTime.getTime());
      }
    }
  });
  // round off seconds
  fullTimeExtent.startTime = new Date(fullTimeExtent.startTime.getFullYear(), fullTimeExtent.startTime.getMonth(), fullTimeExtent.startTime.getDate(), fullTimeExtent.startTime.getHours(), fullTimeExtent.startTime.getMinutes(), 0, 0);
  fullTimeExtent.endTime = new Date(fullTimeExtent.endTime.getFullYear(), fullTimeExtent.endTime.getMonth(), fullTimeExtent.endTime.getDate(), fullTimeExtent.endTime.getHours(), fullTimeExtent.endTime.getMinutes() + 1, 1, 0);
  return fullTimeExtent;
}

function findDefaultTimeInterval(fullTimeExtent) {
  var interval;
  var units;
  var timePerStop = (fullTimeExtent.endTime.getTime() - fullTimeExtent.startTime.getTime()) / 10;
  var century = 1000 * 60 * 60 * 24 * 30 * 12 * 100;
  if (timePerStop > century) {
    interval = Math.round(timePerStop / century);
    units = "esriTimeUnitsCenturies";
  } else {
    var decade = 1000 * 60 * 60 * 24 * 30 * 12 * 10;
    if (timePerStop > decade) {
      interval = Math.round(timePerStop / decade);
      units = "esriTimeUnitsDecades";
    } else {
      var year = 1000 * 60 * 60 * 24 * 30 * 12;
      if (timePerStop > year) {
        interval = Math.round(timePerStop / year);
        units = "esriTimeUnitsYears";
      } else {
        var month = 1000 * 60 * 60 * 24 * 30;
        if (timePerStop > month) {
          interval = Math.round(timePerStop / month);
          units = "esriTimeUnitsMonths";
        } else {
          var week = 1000 * 60 * 60 * 24 * 7;
          if (timePerStop > week) {
            interval = Math.round(timePerStop / week);
            units = "esriTimeUnitsWeeks";
          } else {
            var day = 1000 * 60 * 60 * 24;
            if (timePerStop > day) {
              interval = Math.round(timePerStop / day);
              units = "esriTimeUnitsDays";
            } else {
              var hour = 1000 * 60 * 60;
              if (timePerStop > hour) {
                interval = Math.round(timePerStop / hour);
                units = "esriTimeUnitsHours";
              } else {
                var minute = 1000 * 60;
                if (timePerStop > minute) {
                  interval = Math.round(timePerStop / minute);
                  units = "esriTimeUnitsMinutes";
                } else {
                  var second = 1000;
                  if (timePerStop > second) {
                    interval = Math.round(timePerStop / second);
                    units = "esriTimeUnitsSeconds";
                  } else {
                    interval = Math.round(timePerStop);
                    units = "esriTimeUnitsMilliseconds";
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  var timeStopInterval = {};
  timeStopInterval.units = units;
  timeStopInterval.interval = interval;
  return timeStopInterval;


}
function toggleTime(timeProperties) {
  if (dojo.byId('timeFloater').style.visibility === 'hidden') {
    //create and display the time slider
    createTimeSlider(timeProperties);
    dijit.byId('timeFloater').show();
    dijit.byId('mainWindow').resize();
    //resizeMap();
  } else {
    //stop the time slider if its playing then destroy and hide the time slider
    if (dijit.byId('timeSlider').playing) {
      dijit.byId('timeSlider').pause();
    }
    dijit.byId('timeSlider').destroy();
    map.setTimeExtent(null);
    map.setTimeSlider(null);

    dijit.byId('timeFloater').hide();
    dijit.byId('toggleTimeButton').set('checked', false);
  }
}

function createTimeSlider(timeProperties) {
  var startTime = timeProperties.startTime;
  var endTime = timeProperties.endTime;
  var fullTimeExtent = new esri.TimeExtent(new Date(startTime), new Date(endTime));

  map.setTimeExtent(fullTimeExtent);
  var timeView = dojo.create('div', {
    id: 'timeViewContent'
  });
  dijit.byId('timeFloater').set('content', timeView);

  //create a time slider and a label to hold date details and add to the floating time panel
  var timeSlider = new esri.dijit.TimeSlider({
    style: "width: 100%;",
    id: "timeSlider"
  }, dojo.create('div'));

  var timeSliderLabel = dojo.create('div', {
    id: 'timeSliderLabel'
  }, dojo.byId('timeViewContent'));

  dojo.addClass('timeSliderLabel', 'timeLabel');

  dojo.place(timeSlider.domNode, dojo.byId('timeViewContent'), "last");


  map.setTimeSlider(timeSlider);
  //Set time slider properties
  timeSlider.setThumbCount(timeProperties.thumbCount);
  timeSlider.setThumbMovingRate(timeProperties.thumbMovingRate);
  //define the number of stops
  if (timeProperties.numberOfStops) {
    timeSlider.createTimeStopsByCount(fullTimeExtent, timeProperties.numberOfStops);
  } else {
    timeSlider.createTimeStopsByTimeInterval(fullTimeExtent, timeProperties.timeStopInterval.interval, timeProperties.timeStopInterval.units);
  }
  //set the thumb index values if the count = 2
  if (timeSlider.thumbCount === 2) {
    timeSlider.setThumbIndexes([0, 1]);
  }

  dojo.connect(timeSlider, 'onTimeExtentChange', function (timeExtent) {
    //update the time details span.
    var timeString, datePattern;
    if (timeProperties.timeStopInterval !== undefined) {
      switch (timeProperties.timeStopInterval.units) {
      case 'esriTimeUnitsCenturies':
        datePattern = 'yyyy G';
        break;
      case 'esriTimeUnitsDecades':
        datePattern = 'yyyy';
        break;
      case 'esriTimeUnitsYears':
        datePattern = 'MMMM yyyy';
        break;
      case 'esriTimeUnitsWeeks':
        datePattern = 'MMMM d, yyyy';
        break;
      case 'esriTimeUnitsDays':
        datePattern = 'MMMM d, yyyy';
        break;
      case 'esriTimeUnitsHours':
        datePattern = 'h:m:s.SSS a';
        break;
      case 'esriTimeUnitsMilliseconds':
        datePattern = 'h:m:s.SSS a';
        break;
      case 'esriTimeUnitsMinutes':
        datePattern = 'h:m:s.SSS a';
        break;
      case 'esriTimeUnitsMonths':
        datePattern = 'MMMM d, y';
        break;
      case 'esriTimeUnitsSeconds':
        datePattern = 'h:m:s.SSS a';
        break;
      }
      var startTime = formatDate(timeExtent.startTime, datePattern);
      var endTime = formatDate(timeExtent.endTime, datePattern);
      timeString = esri.substitute({
        "start_time": startTime,
        "end_time": endTime
      }, i18n.tools.time.timeRange);
    } else {
      timeString = esri.substitute({
        "time": formatDate(timeExtent.endTime, datePattern)
      }, i18n.tools.time.timeRangeSingle);

    }
    dojo.byId('timeSliderLabel').innerHTML = timeString;
  });
  timeSlider.startup();

}

function createElevationProfileTools() {

  // DO WE HAVE THE MEASURE TOOL ENABLED //
  if (!measure) {
    console.error("This template requires the measure tool to be enabled.");
    return;
  }

   dijit.byId('bottomPane').set('content','<div id="profileChartPane" dojotype="apl.ElevationsChart.Pane"></div>');

  // GET DEFAULT DISTANCE UNITS BASED ON SCALEBAR UNITS     //
  // IF SCALEBAR IS NOT DISPLAYED THEN USE MILES AS DEFAULT //
  // var defaultDistanceUnits = measure.units.esriMiles;
  var defaultDistanceUnits = measure.units.esriKilometers;

  if (configOptions.displayscalebar === "true" || configOptions.displayscalebar === true) {
    if (i18n.viewer.main.scaleBarUnits === 'metric') {
      defaultDistanceUnits = measure.units.esriKilometers;
    }
  }


  // INITIALIZE ELEVATIONS PROFILE CHART WIDGET               //
  //                                                          //
  // @param {esri.Map} map                                    //
  // @param {esri.dijit.Measurement} measure                  //
  // @param {String} defaultDistanceUnits ( Miles || Meters ) //
  // @param {Boolean} showElevationDifference                 //
  dijit.byId('profileChartPane').init({
    map: map,
    measure: measure,
    defaultDistanceUnits: defaultDistanceUnits,
    showElevationDifference: configOptions.showelevationdifference
  });
}

