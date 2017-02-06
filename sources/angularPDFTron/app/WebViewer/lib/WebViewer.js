
/**
 *The namespace reserved for PDFTron technologies
 *@namespace PDFTron PDFTron namespace
 */
var PDFTron = PDFTron || {};

if (typeof console === "undefined") {
    window.console = {
        log: function() {
        },
        warn: function() {
        },
        error: function() {
        }
    };
}

if (window.PDFNet && !PDFTron.skipPDFNetWebViewerWarning)
{
    console.warn("PDFNet.js and WebViewer.js have been included in the same context. See pdftron.com/kb_same_context for an explanation of why this could be an error in your application.")
}


/**
 * Creates a WebViewer instance and embeds it on the HTML page.
 *
 * @class PDFTron.WebViewer Represents a WebViewer which is a document viewer built using HTML5.
 * @param {PDFTron.WebViewer.Options} options options passed to the specific WebViewer.
 * @example e.g.
 *var viewerElement = document.getElementById('viewer');
 *myWebViewer = new PDFTron.WebViewer({
 *	type: "html5,html5Mobile",
 *	initialDoc : "/host/GettingStarted.xod",
 *	enableAnnotations: true,
 *	streaming : false
 * 	}, viewerElement);
 * @param element the html element that will contain the web viewer (e.g. the <div> element that will be parent of the WebViewer). This can be obtained through document.getElementById(), or through JQuery selector.
 * @return {PDFTron.WebViewer}  the instance of the WebViewer class
 */
PDFTron.WebViewer = function WebViewer(options, element) {
    this.options = $.extend(true, {}, PDFTron.WebViewer.Options, options);
    //set up alternate viewer paths.
    if (typeof options.path !== 'undefined') {
        //alternate path provided
        var lastCharIndex = this.options.path.length - 1;
        if (lastCharIndex > 0 && this.options.path[lastCharIndex] !== '/') {
            this.options.path += '/';
        }
        this.options.html5Path = this.options.path + this.options.html5Path;
        this.options.html5MobilePath = this.options.path + this.options.html5MobilePath;
    }

    this.element = element;
    $(this.element).css('overflow', 'hidden');

    window.WebViewer = {
        l: function() {
            return options.l;
        },
        workerTransportPromise: function() {
            return options.workerTransportPromise
        }
    };

    if (this.options.autoCreate) {
        this.create();
    }
};


PDFTron.WebViewer.prototype = {
    version: '2.2.1',
    create: function() {
        var me = this;
        if (typeof this.options.initialDoc !== 'undefined') {
            var docPath = this._correctRelativePath(this.options.initialDoc);
            docPath = encodeURIComponent(docPath); //url-encode the doc path
            this.options.initialDoc = docPath;
            this._create();
        } else if (typeof this.options.cloudApiId !== 'undefined') {
            $.get('https://api.pdftron.com/v2/download/' + this.options.cloudApiId + "?type=xod&redirect=false", function(data) {
                if (typeof data.url === "undefined") {
                    me.loadErrorPage();
                } else {
                    me.options.initialDoc = encodeURIComponent(data.url);
                    me._create();
                }
            }, 'json')
                    .error(function() {
                        me.loadErrorPage();
                    });
        } else {
            // just create the viewer if there is no initial doc specified
            this._create();
        }
    },
    _create: function() {
        //called by the constructor only once
        var me = this;
        me.rcId = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); //random id
        if ((typeof this._trigger) === 'undefined') {
            this._trigger = function(type, event, data1, data2) {
                //data = data || {};
                event = $.Event(event);
                event.type = type;
                // the original event may come from any element
                // so we need to reset the target on the new event
                event.target = $(this.element)[ 0 ];
                //event.data = data;
                var data = [];
                if (typeof data1 !== 'undefined') {
                    data.push(data1);
                }
                if (typeof data2 !== 'undefined') {
                    data.push(data2);
                }
                $(this.element).trigger(event, data);
            };
        }

        //get the selected type
        var viewers = this.options.type.replace(' ', '').split(",");
        if (viewers.length < 1)
            viewers[0] = "html5"; //use html5 as default

        me._createViewer(viewers);

    },
    _notSupportedMobile: function() {
        $(this.element).append("<div id=\"webviewer-browser-unsupported\">PDF document viewing is not currently supported by the mobile viewer.</div>");
    },
    _createViewer: function(viewers) {
        var me = this;
        me.selectedType = "none";
        if (this.isMobileDevice()) {
            if (this.options.documentType === 'pdf') {
                this._notSupportedMobile();
                return;
            }

            viewers = Array("html5Mobile");
            me.selectedType = "html5Mobile";

            if (this.options.mobileRedirect) {
                // redirect to new location
                var newLocation = this.options.html5MobilePath + this._getHTML5OptionsURL();
                window.location = newLocation;
                return;
            }
        }
        var allowHTML5 = false;

        for (var i = 0; i < viewers.length; i++) {
            if (viewers[i].toLowerCase() === "html5mobile") {
                if (this.options.documentType === 'pdf') {
                    continue;
                }

                allowHTML5 = true;
                if (me._testHTML5()) {
                    if (this.options.mobileRedirect) {
                        // redirect to new location
                        me.selectedType = "html5Mobile";
                        var newLocation = this.options.html5MobilePath + this._getHTML5OptionsURL();
                        window.location = newLocation;
                        return;
                    }
                    if (this.options.xdomainProxyUrl || me.isSameOrigin(decodeURIComponent(me.options.initialDoc)) || me._testCORS()) {
                        me.selectedType = "html5Mobile";
                        break;
                    }
                }
            }
            if (viewers[i].toLowerCase() === "html5") {
                allowHTML5 = true;
                if (me._testHTML5()) {
                    var sameOrigin = me.isSameOrigin(decodeURIComponent(me.options.initialDoc));
                    if (this.options.xdomainProxyUrl || sameOrigin || me._testCORS()) {
                        //if not same origin, need to support xdomain access through CORS
                        me.selectedType = "html5";
                        break;
                    }
                }
            }
        }
        if (me.selectedType === "html5") {
            me._createHTML5();
        } else if (me.selectedType === "html5Mobile") {
            me._createHTML5Mobile();
        } else {
            if (allowHTML5) {
                var supportError = "Please use an HTML5 compatible browser";
                $(me.element).append("<div id=\"webviewer-browser-unsupported\">" + supportError + ".</div>");
            }
        }
    },
    _viewerLoaded: function(iframe) {
        var me = this;
        me._trigger('ready');

        var viewerWindow = iframe.contentWindow;

        if (typeof me.options.encryption !== "undefined") {
            var doc = decodeURIComponent(me.options.initialDoc);
            var loadOptions = {
                decrypt: viewerWindow.CoreControls.Encryption.decrypt,
                decryptOptions: me.options.encryption
            }; // get the load options set via constructor

            viewerWindow.ControlUtils.byteRangeCheck(function(status) {
                // if the range header is supported then we will receive a status of 206
                if (status === 200) {
                    loadOptions.streaming = true;
                }
                me.loadDocument(doc, loadOptions);
            }, function() {
                // some browsers that don't support the range header will return an error
                loadOptions.streaming = true;
                me.loadDocument(doc, loadOptions);
            });
        }

        if (me.instance.docViewer.getDocument() === null) {
            //note, we need bind using the iframe window's instance of jQuery
            viewerWindow.$(iframe.contentDocument).bind('documentLoaded', function(event) {
                me._trigger(event.type);
            });
        } else {
            //a document is already loaded, trigger the documentLoaded event directly
            me._trigger('documentLoaded');
        }

        //bind the rest of the events/callbacks here
        viewerWindow.$(iframe.contentDocument).bind
                ('displayModeChanged layoutModeChanged zoomChanged pageChanged fitModeChanged toolModeChanged printProgressChanged error',
                        function(event, data1, data2) {
                            //relay event
                            me._trigger(event.type, null, data1, data2);
                        });
    },
    _getHTML5OptionsURL: function() {
        if (this.selectedType === "html5") {
            if (this.options.html5Options) {
                $.extend(this.options, this.options.html5Options);
            }

        } else if (this.selectedType === "html5Mobile") {
            if (this.options.html5MobileOptions) {
                $.extend(this.options, this.options.html5MobileOptions);
            }
        }

        var options = this.options;
        var url = "";

        var me = this;

        function acceptPdfUrl() {
            // optionally force pdf backend, else default to auto
            url += options.pdfBackend ? "&pdf=" + options.pdfBackend : "&pdf=auto";
        }

        if (typeof options.initialDoc !== "undefined") {
            url += "#d=" + options.initialDoc;
        }
        // If document type not specified, use extension to determine viewer to load
        // Default to xod file format if not specified
        if (options.documentType === 'pdf') {
            if (typeof options.backendType === "undefined") {
                acceptPdfUrl();
            } else {
                url += "&pdf=nodejs";
            }
        } else if (typeof options.documentType === "undefined" &&
                typeof options.initialDoc !== "undefined" && options.initialDoc.toLowerCase().slice(-4) === '.pdf') {
            acceptPdfUrl();
        }
        if (options.streaming) {
            url += "&streaming=true";
        }
        if (options.externalPath) {
            var path = this._correctRelativePath(options.externalPath);
            path = encodeURIComponent(path);
            url += "&p=" + path;
        }
        if (options.encryption) {
            // we want to stop the document from automatically loading if it's encrypted as we'll do that later passing the options to it
            url += "&auto_load=false";
        }
        if (options.enableAnnotations) {
            url += "&a=1";
        }
        if (options.serverUrl) {
            var serverUrl = this._correctRelativePath(options.serverUrl);
            serverUrl = encodeURIComponent(serverUrl);
            url += "&server_url=" + serverUrl;
        }
        if (options.documentId) {
            url += "&did=" + options.documentId;
        }
        if (options.config) {
            var config = this._correctRelativePath(options.config);
            config = encodeURIComponent(config);
            url += "&config=" + config;
        }
        if (options.enableOfflineMode) {
            url += "&offline=1";
        }
        if (options.startOffline) {
            url += "&startOffline=1";
        }
        if (options.enableReadOnlyMode) {
            url += "&readonly=1";
        }
        if (options.hideAnnotationPanel) {
            url += "&hideAnnotationPanel=1";
        }
        if (typeof options.annotationUser !== 'undefined') {
            url += "&user=" + options.annotationUser;
        }
        if (typeof options.annotationAdmin !== 'undefined') {
            url += "&admin=" + (options.annotationAdmin ? 1 : 0);
        }
        if (typeof options.custom !== "undefined") {
            url += "&custom=" + encodeURIComponent(options.custom);
        }
        if (typeof options.showLocalFilePicker !== "undefined") {
            url += "&filepicker=" + (options.showLocalFilePicker ? 1 : 0);
        }
        if (typeof options.preloadPDFWorker !== "undefined") {
            url += "&preloadWorker=" + (options.preloadPDFWorker ? 1 : 0);
        }
        if (typeof options.pdfnet !== "undefined") {
            url += "&pdfnet=" + (options.pdfnet ? 1 : 0);
        }
        if (typeof options.showToolbarControl !== "undefined") {
            url += "&toolbar=" + (options.showToolbarControl ? "true" : "false");
        }
        if (typeof options.showPageHistoryButtons !== "undefined") {
            url += "&pageHistory=" + (options.showPageHistoryButtons ? 1 : 0);
        }
        if (typeof options.xdomainProxyUrl !== "undefined") {
            var urls;
            if (typeof options.xdomainProxyUrl === "string") {
                // if the option is a string then a single url is being used and is handled differently
                // the single url will be on the url property
                urls = {
                    url: options.xdomainProxyUrl
                };
            } else {
                // urls passed in through object form can be kept as is
                urls = options.xdomainProxyUrl;
            }
            url += "&xdomain_urls=" + encodeURIComponent(JSON.stringify(urls));
        }
        if (options.azureWorkaround) {
            url += "&azureWorkaround=1";
        }
        if (!options.useDownloader){
            url += '&useDownloader=0';
        }
        if (typeof options.workerTransportPromise !== "undefined"){
            url += '&useSharedWorker=' + (options.workerTransportPromise ? "true" : "false");
        }

        // if there is no initial doc specified then the first character might not be a '#' so fix this
        if (url.length > 0 && url[0] === '&') {
            url = '#' + url.slice(1);
        }

        return url;
    },
    _createHTML5: function() {
        var me = this;
        var iframeSource = this.options.html5Path + this._getHTML5OptionsURL();

        //_getHTML5OptionsURL
        var $rcFrame = $(document.createElement('iframe'));
        $rcFrame.attr({
            id: this.rcId,
            src: iframeSource,
            frameborder: 0,
            width: "100%",
            height: "100%",
            allowFullScreen: true,
            webkitallowfullscreen: true,
            mozallowfullscreen: true
        });
        if (this.options.backgroundColor) {
            $rcFrame.attr('data-bgcolor', this.options.backgroundColor);
        }

        var outerWindow = window;

        $rcFrame.load(function() {
            me.instance = this.contentWindow.readerControl;

            //same the namespaces to the outer window
            outerWindow.CoreControls = outerWindow.CoreControls || {};
            outerWindow.CoreControls.DisplayModes = this.contentWindow.CoreControls.DisplayModes;

            var iframe = this;

            if (typeof me.instance === "undefined") {
                this.contentWindow.$(this.contentDocument).bind('viewerLoaded', function(event) {
                    me.instance = iframe.contentWindow.readerControl;
                    me._viewerLoaded(iframe);
                });
            } else {
                me._viewerLoaded(iframe);
            }
        });

        $(this.element).append($rcFrame);
        return $rcFrame;
    },
    _createHTML5Mobile: function() {
        // use the correct type if mobile
        var me = this;
        var iframeSource = this.options.html5MobilePath + this._getHTML5OptionsURL();

        var $rcFrame = $(document.createElement('iframe'));
        $rcFrame.attr({
            id: this.rcId,
            src: iframeSource,
            frameborder: 0
        });
        $rcFrame.css('width', '100%').css("height", "100%");
        $rcFrame.load(function() {
            me.instance = this.contentWindow.readerControl;

            var iframe = this;

            if (typeof me.instance === "undefined") {
                this.contentWindow.$(this.contentDocument).bind('viewerLoaded', function(event) {
                    me.instance = iframe.contentWindow.readerControl;
                    me._viewerLoaded(iframe);
                });
            } else {
                me._viewerLoaded(iframe);
            }
        });
        $(this.element).append($rcFrame);
        //$(this.element).load(iframeSource);
        return $rcFrame;
    },
    _init: function() {
    },
    /**
     * Gets the instance of the ReaderControl object loaded by WebViewer.
     * @return a ReaderControl instance
     */
    getInstance: function() {
        return this.instance;
    },
    loadErrorPage: function() {
        if (typeof this.options.errorPage === 'undefined') {
            $(this.element).append("<h2 style='text-align:center;margin-top:100px'>We're sorry, an error has occurred.</h2>");
        } else {
            $(this.element).load(this.options.errorPage);
        }
    },
    /**
     * Gets the visibility of the default side window.
     * Not supported for mobile viewer.
     * @returns {boolean} true if the side window is visible.
     */
    getSideWindowVisibility: function() {
        return this.getInstance().getShowSideWindow();
    },
    /**
     * Gets the visibility of the default side window.
     * Not supported for mobile viewer.
     *
     * @param {boolean} value true to show the side window
     */
    setSideWindowVisibility: function(value) {
        this.getInstance().setShowSideWindow(value);
    },
    /**
     * Gets the value whether the side window is visible or not.
     * Not supported for mobile viewer.
     * @return true if the side window is shown
     * @deprecated since version 1.7. Replaced by {@link PDFTron.WebViewer#getSideWindowVisibility}.
     */
    getShowSideWindow: function() {
        return this.getSideWindowVisibility();
    },
    /**
     * Sets the value whether the side window is visible or not.
     * Not supported for mobile viewer.
     * @param value true to show the side window
     * @deprecated since 1.7. Replaced by {@link PDFTron.WebViewer#setShowSideWindow}.
     */
    setShowSideWindow: function(value) {
        this.setSideWindowVisibility(value);
    },
    /**
     * Gets the visibilty of the default toolbar control.
     * @returns {boolean} true if the toolbar is visible.
     */
    getToolbarVisibility: function() {
        console.warn("Unsupported method getToolbarVisibility");
    },
    /**
     * Sets the visibilty of the default toolbar control.
     * @param {boolean} isVisible true if the toolbar is visible.
     */
    setToolbarVisibility: function(isVisible) {
        this.getInstance().setToolbarVisibility(isVisible);
    },
    /**
     * Gets the current page number of the document loaded in the WebViewer.
     * @return the current page number of the document
     */
    getCurrentPageNumber: function() {
        return this.getInstance().getCurrentPageNumber();
    },
    /**
     * Sets the current page number of the document loaded in the WebViewer.
     * @param pageNumber the page number of the document to set
     */
    setCurrentPageNumber: function(pageNumber) {
        this.getInstance().setCurrentPageNumber(pageNumber);
    },
    /**
     * Gets the total number of pages of the loaded document.
     * @return the total number of pages of the loaded document
     */
    getPageCount: function() {
        return this.getInstance().getPageCount();
    },
    /**
     * Gets the zoom level of the document.
     * @return {number} the zoom level of the document
     */
    getZoomLevel: function() {
        return this.getInstance().getZoomLevel();
    },
    /**
     * Sets the zoom level of the document.
     * @param zoomLevel the new zoom level to set
     */
    setZoomLevel: function(zoomLevel) {
        this.getInstance().setZoomLevel(zoomLevel);
    },
    /**
     * Rotates the document in the WebViewer clockwise.
     * Not supported for mobile viewer.
     */
    rotateClockwise: function() {
        this.getInstance().rotateClockwise();
    },
    /**
     * Rotates the document in the WebViewer counter-clockwise.
     * Not supported for mobile viewer.
     */
    rotateCounterClockwise: function() {
        this.getInstance().rotateCounterClockwise();
    },
    /**
     * Gets the layout mode of the document in the WebViewer.
     * Not supported for mobile viewer.
     * @return {PDFTron.WebViewer.LayoutMode} the layout mode of the document
     */
    getLayoutMode: function() {
        var layoutMode = this.getInstance().getLayoutMode();
        var displayModes = CoreControls.DisplayModes;

        // the HTML5 viewer has different naming schemes for this
        if (layoutMode === displayModes.Single) {
            return PDFTron.WebViewer.LayoutMode.Single;
        } else if (layoutMode === displayModes.Continuous) {
            return PDFTron.WebViewer.LayoutMode.Continuous;
        } else if (layoutMode === displayModes.Facing) {
            return PDFTron.WebViewer.LayoutMode.Facing;
        } else if (layoutMode === displayModes.FacingContinuous) {
            return PDFTron.WebViewer.LayoutMode.FacingContinuous;
        } else if (layoutMode === displayModes.Cover) {
            return PDFTron.WebViewer.LayoutMode.FacingCoverContinuous;
        } else if (layoutMode === displayModes.CoverFacing) {
            return PDFTron.WebViewer.LayoutMode.FacingCover;
        } else {
            return undefined;
        }
    },
    /**
     * Sets the layout mode of the document in the WebViewer.
     * Not supported for mobile viewer.
     * @param {PDFTron.WebViewer.LayoutMode} layoutMode the layout mode to set.
     */
    setLayoutMode: function(layoutMode) {
        var displayModes = CoreControls.DisplayModes;

        var displayMode = displayModes.Continuous;

        // the HTML5 viewer have different naming schemes for this
        if (layoutMode === PDFTron.WebViewer.LayoutMode.Single) {
            displayMode = displayModes.Single;
        } else if (layoutMode === PDFTron.WebViewer.LayoutMode.Continuous) {
            displayMode = displayModes.Continuous;
        } else if (layoutMode === PDFTron.WebViewer.LayoutMode.Facing) {
            displayMode = displayModes.Facing;
        } else if (layoutMode === PDFTron.WebViewer.LayoutMode.FacingContinuous) {
            displayMode = displayModes.FacingContinuous;
        } else if (layoutMode === PDFTron.WebViewer.LayoutMode.FacingCover) {
            displayMode = displayModes.CoverFacing;
            //displayMode = displayModes.Cover;
        } else if (layoutMode === PDFTron.WebViewer.LayoutMode.FacingCoverContinuous) {
            displayMode = displayModes.Cover;
            //displayMode = displayModes.CoverContinuous;
        }

        this.getInstance().setLayoutMode(displayMode);
    },
    /**
     * Gets the current tool mode of the WebViewer.
     * Not supported for mobile viewer.
     * @return {PDFTron.WebViewer.ToolMode} the current tool mode of the WebViewer
     */
    getToolMode: function() {
        return this.getInstance().getToolMode();
    },
    /**
     * Sets the tool mode of the WebViewer.
     * Not supported for mobile viewer.
     * @param {PDFTron.WebViewer.ToolMode} toolMode  must be one of the PDFTron.WebViewer.ToolMode
     */
    setToolMode: function(toolMode) {
        this.getInstance().setToolMode(toolMode);
    },
    /**
     * Controls if the document's Zoom property will be adjusted so that the width of the current page or panel
     * will exactly fit into the available space.
     * Not supported for mobile viewer.
     * @deprecated since 1.7. Use {@link PDFTron.WebViewer#setFitMode} instead.
     */
    fitWidth: function() {
        this.getInstance().fitWidth();
    },
    /**
     * Controls if the document's Zoom property will be adjusted so that the height of the current page or panel
     * will exactly fit into the available space.
     * Not supported for mobile viewer.
     * @deprecated since 1.7. Use {@link PDFTron.WebViewer#setFitMode} instead.
     */
    fitHeight: function() {
        this.getInstance().fitHeight();
    },
    /**
     * Controls if the document's Zoom property will be adjusted so that the width and height of the current page or panel
     * will fit into the available space.
     * Not supported for mobile viewer.
     * @deprecated since 1.7. Use {@link PDFTron.WebViewer#setFitMode} instead.
     */
    fitPage: function() {
        this.getInstance().fitPage();
    },
    /**
     * Gets the current fit mode of the viewer
     * @since version 1.7
     * @return {PDFTron.WebViewer.FitMode}
     */
    getFitMode: function() {
        var fitMode = this.getInstance().getFitMode();
        var FitModeEnums = this.getInstance().docViewer.FitMode;
        switch (fitMode) {
            case FitModeEnums.FitWidth:
                return PDFTron.WebViewer.FitMode.FitWidth;
            case FitModeEnums.FitHeight:
                return PDFTron.WebViewer.FitMode.FitHeight;
            case FitModeEnums.FitPage:
                return PDFTron.WebViewer.FitMode.FitPage;
            case FitModeEnums.Zoom:
                return PDFTron.WebViewer.FitMode.Zoom;
            default:
                console.warn("Unsupported fit mode");
        }
    },
    /**
     * Sets the fit mode of the viewer.
     * This is equivalent to calling the methods: fitWidth, fitHeight, fitPage, zoom
     * @param {PDFTron.WebViewer.FitMode} fitMode
     * @since version 1.7
     */
    setFitMode: function(fitMode) {
        if (fitMode === PDFTron.WebViewer.FitMode.FitWidth) {
            this.fitWidth();
        } else if (fitMode === PDFTron.WebViewer.FitMode.FitHeight) {
            this.fitHeight();
        } else if (fitMode === PDFTron.WebViewer.FitMode.FitPage) {
            this.fitPage();
        } else if (fitMode === PDFTron.WebViewer.FitMode.Zoom) {
            this.zoom();
        } else {
            console.warn("Unsupported fit mode: " + fitMode);
        }
    },
    /**
     * Controls if the document's Zoom property will be freely adjusted and not constrained with the width and height of the
     * current page or panel.
     * Not supported for mobile viewer.
     * @deprecated since 1.7. Use {@link PDFTron.WebViewer#setFitMode} instead.
     */
    zoom: function() {
        this.getInstance().fitZoom();
    },
    /**
     * Goes to the first page of the document. Makes the document viewer display the first page of the document.
     */
    goToFirstPage: function() {
        this.getInstance().goToFirstPage();
    },
    /**
     * Goes to the last page of the document. Makes the document viewer display the last page of the document.
     */
    goToLastPage: function() {
        this.getInstance().goToLastPage();
    },
    /**
     * Goes to the next page of the document. Makes the document viewer display the next page of the document.
     */
    goToNextPage: function() {
        this.getInstance().goToNextPage();
    },
    /**
     * Goes to the previous page of the document. Makes the document viewer display the previous page of the document.
     */
    goToPrevPage: function() {
        this.getInstance().goToPrevPage();
    },
    /**
     * Loads a document to the WebViewer.
     * @param {String} url the URL of the document to be loaded
     * @param loadOptions options for loading a new document
     * @param loadOptions.documentId a unique identifer for the document. When an annotation server is specified, this ID will be sent to the server
     * @param loadOptions.filename the filename of the document.
     * @param loadOptions.customHeaders an object custom HTTP headers to use when retrieving the document from the specified url. For example: {'Authorization':'Basic dXNlcm5hbWU6cGFzc3dvcmQ='}
     */
    loadDocument: function(url, options) {
        var existingLoadOptions = {
            streaming: this.options.streaming
        };
        var load_options = $.extend(true, {}, existingLoadOptions, options);
        if (typeof load_options.documentId !== "undefined") {
            //allow "null" values
            this.getInstance().docId = load_options.documentId;
        }
        this.getInstance().loadDocument(this._correctRelativePath(url), load_options);
    },
    /**
     * Searches the loaded document finding for the matching pattern.
     *
     * Search mode includes:
     * <ul>
     * <li>None</li>
     * <li>CaseSensitive</li>
     * <li>WholeWord</li>
     * <li>SearchUp</li>
     * <li>PageStop</li>
     * <li>ProvideQuads</li>
     * <li>AmbientString</li>
     * </ul>
     *
     * @param pattern       the pattern to look for
     * @param searchMode    must one or a combination of the above search modes. To
     *                      combine search modes, simply pass them as comma separated
     *                      values in one string. i.e. "CaseSensitive,WholeWord"
     */
    searchText: function(pattern, searchModes) {
        var mode = 0;
        var modes = searchModes;
        if (typeof modes === 'string') {
            modes = searchModes.split(',');
        }
        if (typeof modes !== "undefined") {
            for (var i = 0; i < modes.length; i++) {
                if (modes[i] === "CaseSensitive") {
                    mode += 0x1;
                }
                else if (modes[i] === "WholeWord") {
                    mode += 0x2;
                }
                else if (modes[i] === "SearchUp") {
                    mode += 0x4;
                }
                else if (modes[i] === "PageStop") {
                    mode += 0x8;
                }
                else if (modes[i] === "ProvideQuads") {
                    mode += 0x10;
                }
                else if (modes[i] === "AmbientString") {
                    mode += 0x20;
                }
            }
        }

        if (typeof searchModes === 'undefined') {
            this.getInstance().searchText(pattern);
        } else {
            this.getInstance().searchText(pattern, mode);
        }
    },
    /**
     * Sets the annotation author.
     * @param {string} username
     */
    setAnnotationUser: function(username) {
        this.getInstance().setAnnotationUser(username);
    },
    /**
     * Sets the administrative permissions for the current annotation user.
     * @param {boolean} isAdminUser
     */
    setAdminUser: function(isAdminUser) {
        this.getInstance().setAdminUser(isAdminUser);
    },
    /**
     * Sets the viewer's annotation read-only state. When read-only, users will be allowed to view annotations
     and its popup text contents, but will not be able to edit or create new annotations.
     * @param {boolean} isReadOnly
     */
    setReadOnly: function(isReadOnly) {
        this.getInstance().setReadOnly(isReadOnly);
    },
    /**
     * Opens the XOD document through the browser to be downloaded.
     * @since version 1.7
     */
    downloadXodDocument: function() {
        if (this.documentType === 'xod') {
            var url = decodeURIComponent(this.options.initialDoc);
            window.open(url);
        } else {
            console.warn("Unsupported method for this document type");
        }
    },
    /**
     * Starts a printing job for the passed in pages. (Desktop only)
     * @param {string} pages The pages that should be printed. Multiple pages can be separated by commas
        and ranges can be specified by a dash (e.g. 1,3-5)
     */
    startPrintJob: function(pages) {
        if (this.selectedType === "html5") {
            this.getInstance().startPrintJob(pages);
        } else {
            console.warn("Unsupported method startPrintJob");
        }
    },
    /**
     * Cleans up the resources that were used for printing. (Desktop only)
     */
    endPrintJob: function() {
        if (this.selectedType === "html5") {
            this.getInstance().endPrintJob();
        } else {
            console.warn("Unsupported method endPrintJob");
        }
    },
    /**
     * Gets the currently loaded viewer type. This is only valid after the documentLoaded event.
	 * @return {string} the viewer type: "html5" or "html5Mobile"
     */
    getViewerType: function() {
        return this.selectedType;
    },
    //JQuery UI Widget option method
    option: function(key, value) {
        // optional: get/change options post initialization
        // ignore if you don't require them.

        // signature: $('#viewer').webViewer({ type: 'html5' });
        if ($.isPlainObject(key)) {
            this.options = $.extend(true, this.options, key);

            // signature: $('#viewer').option('type'); - getter
        } else if (key && typeof value === "undefined") {
            return this.options[key];

            // signature: $('#viewer').webViewer('option', 'type', 'html5');
        } else {
            this.options[key] = value;
        }

        // required: option must return the current instance.
        // When re-initializing an instance on elements, option
        // is called first and is then chained to the _init method.
        return this;
    },
    //make relative paths absolute
    _correctRelativePath: function(path) {
        //get current url
        var curdir = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'));
        //pattern begins with --> https:// or http:// or file:// or / or blob: or %2F (%2F is '/' url encoded. Necessary to work with S3 signatures)
        var pattern = /^(https?:\/\/|file:\/\/|\/|blob:|%2F|filesystem:)/i;
        //correct relative paths by prepending "../"
        return pattern.test(path) ? path : curdir + '/' + path;
    },
    _testHTML5: function() {
        try {
            var c = document.createElement('canvas');
            return (c && c.getContext('2d'));
        } catch (e) {
            //console.warn(e);
            return false;
        }
    },
    _supports: function(type) {
        if (type === this.selectedType) {
            return true;
        }
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i] === this.selectedType) {
                return true;
            }
        }
        return false;
    },
    _testCORS: function() {
        //https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
        return 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest();
    },
    /**
     * Detects if the current browser is on a mobile device.
     * @return {boolean} true if this page is loaded on a mobile device.
     */
    isMobileDevice: function() {
        return ((this.scrollbarWidth() === 0 && navigator.userAgent.match(/Edge/i))
                || navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i)
                || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)
                || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/Touch/i)
                || navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/Silk/i));
    },
    // In windows 10 tablets, the tablet mode and desktop mode use the same user agent.  HOWEVER
    // the scrollbar width in tablet mode is 0.  This means that we can find the scrollbar width
    // and use it to determine if they are in tablet mode (mobile viewer) or desktop mode
    scrollbarWidth: function() {
        var scrollDiv = document.createElement("div");
        scrollDiv.style.cssText = 'width:100px;height:100px;overflow:scroll !important;position:absolute;top:-9999px';
        document.body.appendChild(scrollDiv);
        var result = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return result;
    },
    isChrome: function() {
        // opera and maxthon have chrome in their useragent string so we need to be careful!
        // and so does edge...stupid sneaky edge
        var opera = window.navigator.userAgent.match(/OPR/);
        var maxthon = window.navigator.userAgent.match(/Maxthon/);
        var edge = window.navigator.userAgent.match(/Edge/);
        return (window.navigator.userAgent.match(/Chrome\/(.*?) /) && !opera && !maxthon && !edge);
    },
    /**
     * Detects if the give url string is in the same origin as the current page
     * @param {type} url the URL to test against
     * @returns {boolean} true if the provided URL is in the same origin as the current page
     */
    isSameOrigin: function(url) {
        var loc = window.location;
        var a = document.createElement('a');

        a.href = url;
        if (a.host === "") {
            // IE won't set the properties we want if we set href to a relative path, but it will
            // automatically change href to an absolute path, so if we set it again as absolute then
            // hostname, port and protocol will be set as expected
            a.href = a.href;
        }

        var locPort = window.location.port;
        var aPort = a.port;

        if (a.protocol === "http:") {
            aPort = aPort || "80";
            locPort = locPort || "80";

        } else if (a.protocol === "https:") {
            aPort = aPort || "443";
            locPort = locPort || "443";
        }

        return (a.hostname === loc.hostname && a.protocol === loc.protocol && aPort === locPort);
    }
};



/**
 *A jQuery event bound on the element, triggered when the viewer is ready, before a document is loaded.
 *@name PDFTron.WebViewer#ready
 *@example e.g. $('#viewer').bind('ready', function(event, data){//event triggered});
 *@event
 */
/**
 *A jQuery event bound on the element, triggered when a document has been loaded in the viewer.
 *@name PDFTron.WebViewer#documentLoaded
 *@event
 *@example e.g. $('#viewer').bind('documentLoaded', function(event, data){//event triggered});
 */
/**
 *A jQuery event bound on the element, triggered when the page number has changed.
 *@name PDFTron.WebViewer#pageChanged
 *@event
 *@example e.g. $('#viewer').bind('pageChanged', function(event, data){//event triggered});
 */
/**
 *A jQuery event bound on the element, triggered when the zoom level has changed.
 *@name PDFTron.WebViewer#zoomChanged
 *@event
 *@example e.g. $('#viewer').bind('zoomChanged', function(event, data){//event triggered});
 */
/**
 *A jQuery event bound on the element, triggered when the display mode has changed.
 *@name PDFTron.WebViewer#displayModeChanged
 *@event
 *@deprecated since version 1.7. Use layoutModeChanged instead
 *@example e.g. $('#viewer').bind('displayModeChanged', function(event, data){//event triggered});
 */
/**
 *A jQuery event bound on the element, triggered when the layout mode has changed.
 *@name PDFTron.WebViewer#layoutModeChanged
 *@event
 *@since version 1.7
 *@example e.g. $('#viewer').bind('layoutModeChanged', function(event, data){//event triggered});
 */
/**
 *A jQuery event bound on the element, triggered when the tool mode has changed.
 *@name PDFTron.WebViewer#toolModeChanged
 *@event
 *@example e.g. $('#viewer').bind('toolModeChanged', function(event, data){//event triggered});
 */

//if JQuery UI framework is present, create widget for WebViewer
if (typeof $.widget === 'function') {
    $.widget("PDFTron.webViewer", PDFTron.WebViewer.prototype);
}


/**
 * Contains string enums for all layouts for WebViewer.
 *
 * @name PDFTron.WebViewer.LayoutMode
 * @namespace LayoutModes are used to dictate how pages are placed within the viewer. Used by {@link PDFTron.WebViewer#setLayoutMode} and {@link PDFTron.WebViewer#getLayoutMode}.
 */
PDFTron.WebViewer.LayoutMode = {
    /**
     * Only the current page will be visible.
     *
     * @name PDFTron.WebViewer.LayoutMode.Single
     */
    Single: "SinglePage",
    /**
     * All pages are visible in one column.
     *
     * @name PDFTron.WebViewer.LayoutMode.Continuous
     */
    Continuous: "Continuous",
    /**
     * Up to two pages will be visible.
     *
     * @name PDFTron.WebViewer.LayoutMode.Facing
     */
    Facing: "Facing",
    /**
     * All pages visible in two columns.
     *
     * @name PDFTron.WebViewer.LayoutMode.FacingContinuous
     */
    FacingContinuous: "FacingContinuous",
    /**
     * All pages visible in two columns, with an even numbered page rendered first.
     * i.e. The first page of the document is rendered by itself on the right side of the viewer to simulate a book cover.
     * @name PDFTron.WebViewer.LayoutMode.FacingCover
     */
    FacingCover: "FacingCover",
    /**
     * All pages visible, with an even numbered page rendered first.
     * i.e. The first page of the document is rendered by itself on the right side of the viewer to simulate a book cover.
     * @name PDFTron.WebViewer.LayoutMode.FacingCoverContinuous
     */
    FacingCoverContinuous: "CoverContinuous"
};

/**
 * Contains string enums for all default tools for WebViewer.
 * @name PDFTron.WebViewer.ToolMode
 * @namespace ToolModes are string enum representations of tools used by WebViewer. They range from panning, text selection to annotation creation. This is used by {@link PDFTron.WebViewer#setToolMode} and {@link PDFTron.WebViewer#getToolMode}.
 */
PDFTron.WebViewer.ToolMode = {
    /**
     * @name PDFTron.WebViewer.ToolMode.Pan
     */
    Pan: "Pan",
    /**
     * @name PDFTron.WebViewer.ToolMode.TextSelect
     */
    TextSelect: "TextSelect",
    /**
     * @name PDFTron.WebViewer.ToolMode.PanAndAnnotationEdit
     */
    PanAndAnnotationEdit: "PanAndAnnotationEdit",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationEdit
     */
    AnnotationEdit: "AnnotationEdit",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateCustom
     */
    AnnotationCreateCustom: "AnnotationCreateCustom",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateEllipse
     */
    AnnotationCreateEllipse: "AnnotationCreateEllipse",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateFreeHand
     */
    AnnotationCreateFreeHand: "AnnotationCreateFreeHand",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateLine
     */
    AnnotationCreateLine: "AnnotationCreateLine",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateRectangle
     */
    AnnotationCreateRectangle: "AnnotationCreateRectangle",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateSticky
     */
    AnnotationCreateSticky: "AnnotationCreateSticky",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateTextHighlight
     */
    AnnotationCreateTextHighlight: "AnnotationCreateTextHighlight",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateTextStrikeout
     */
    AnnotationCreateTextStrikeout: "AnnotationCreateTextStrikeout",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateTextUnderline
     */
    AnnotationCreateTextUnderline: "AnnotationCreateTextUnderline",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreatePolyline
     */
    AnnotationCreatePolyline: "AnnotationCreatePolyline",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreatePolygon
     */
    AnnotationCreatePolygon: "AnnotationCreatePolygon",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateCallout
     */
    AnnotationCreateCallout: "AnnotationCreateCallout",
    /**
     * @name PDFTron.WebViewer.ToolMode.AnnotationCreateFreeText
     */
    AnnotationCreateFreeText: "AnnotationCreateFreeText"
};

/**
 * @class Options for WebViewer on creation. Used when constructing a new {@link PDFTron.WebViewer} instance.
 * @property {string} [type="html5,html5Mobile"] the type of WebViewer to load. Values must be comma-separated in order of preferred WebViewer. (Possibe values: html5, html5Mobile)
 * @property {string} initialDoc the URL path to a xod document to load on startup
 * @property {string} [externalPath] the path to a xod document folder generated using the external parts option
 * @property {boolean} [streaming=false] a boolean indicating whether to use http or streaming PartRetriever, it is recommended to keep streaming false for better performance.
 * @property {boolean} [hideAnnotationPanel=false] whether to hide the annotation panel or not.
 * @property {boolean} [enableAnnotations=false] a boolean to enable annotations.
 * @property {boolean} [enableOfflineMode] a boolean to enable offline mode.(default false)
 * @property {boolean} [startOffline] whether to start loading the document in offline mode or not.(default false)
 * @property {boolean} [enableReadOnlyMode] a boolean to enable annotations read-only mode.(default false)
 * @property {string} [config] a URL path to a JavaScript configuration file that holds UI customizations.
 * @property {string} [l] the license key for viewing PDF files (PDF only)
 * @property {string} [serverUrl] a URL to the server-side script that handles annotations. (required for full annotation support)
 * @property {string} [annotationUser] a user identifier for annotations. All annotations created will have this as the author. It is used for permission checking: user only permitted to modify annotations where annotationUser and author matches.
 * @property {boolean} [annotationAdmin] a boolean indicating this user has permission to modify all annotations, even if the annotationUser and author does not match.
 * @property {string} [documentId] an identifier for the document to be used with annotations. (required for full annotation support)
 * @property {string} [documentType] the type of document the viewer will be used with. Valid values are "xod" and "pdf". (default "xod")
 * @property {string} [cloudApiId] the share ID or session ID created from <a href="http://www.pdftron.com/pws/cloud" target="_blank">PWS Cloud</a>. Note: the browser must have CORS support. (optional, ignored when initialDoc is also set)
 * @property {string} [custom] a string of custom data that can be retrieved by the ReaderControl
 * @property {boolean} [mobileRedirect=true] a boolean indicating whether the mobile viewer should redirect to a new window or not (mobile only, default true)
 * @property {object} [encryption] an object containing encryption properties (XOD only)
 * @property {string} [xdomainProxyUrl] a URL to the proxy HTML file on the remote server when using the xdomain CORS workaround. Can also be an object to specify multiple URLs.
 * @property {boolean} [azureWorkaround] whether or not to workaround the issue of Azure not accepting range requests of a certain type. Enabling the workaround will add an extra HTTP request of overhead but will still allow documents to be loaded from other locations.
 * @property {boolean} [showLocalFilePicker] a boolean to show/hide the local file picker (PDF only, default false)
 * @property {boolean} [preloadPDFWorker] a boolean to enable the preloading of the PDF worker files (PDF only, default true)
 * @property {boolean} [workerTransportPromise] a promise that will resolve to a PDF worker, used if you already create a worker on the outer page and want to share it with the viewer (PDF only)
 * @property {boolean} [pdfnet] a boolean to enable the use of PDFNet.js library functions (PDF only, default false)
 * @property {boolean} [useDownloader] enable or disable using Downloader on urls (PDF only, default true)
 * @property {boolean} [showToolbarControl] a boolean to show/hide the default toolbar control.
 * @property {boolean} [showPageHistoryButtons] a boolean to show/hide the page history buttons (default true)
 * @property {PDFTron.WebViewer.Options} [html5Options] a PDFTron.WebViewer.Options object that overrides the existing options when the viewer is loaded.
 * @property {PDFTron.WebViewer.Options} [html5MobileOptions] a PDFTron.WebViewer.Options object that overrides the existing options when the Mobile viewer is loaded.
 * @property {string} [errorPage] a path to an HTML page to display errors.
 * @property {string} [backgroundColor] a string to set the background color of the inner page to (desktop only)
 * @property {string} [path] an alternative path to the WebViewer root folder.
 * @property {string} [html5Path="html5/ReaderControl.html"] an alternative path to the WebViewer, relative to the "path" option.
 * @property {string} [html5MobilePath="html5/MobileReaderControl.html"] an alternative path to the Mobile WebViewer, relative to the "path" option.
 * @property {boolean} [autoCreate=true] a boolean to control creating the viewer in the constructor. When set to false, invoke the create() method explicity. (default true)
 * @property {string} [pdfBackend="auto"] a string to control PDF engine ["auto", "ems", "pnacl"](PDF only, default "auto" chooses the best option availible)
 */
PDFTron.WebViewer.Options = {
    type: "html5,html5Mobile",
    path: '',
    html5Path: "html5/ReaderControl.html",
    html5MobilePath: "html5/MobileReaderControl.html",
    autoCreate: true,
    initialDoc: undefined,
    externalPath: undefined,
    cloudApiId: undefined,
    hideAnnotationPanel: false,
    enableAnnotations: false,
    enableOfflineMode: false,
    startOffline: false,
    enableReadOnlyMode: false,
    errorPage: undefined,
    backgroundColor: undefined,
    serverUrl: undefined,
    documentId: undefined,
    documentType: undefined,
    streaming: false,
    config: undefined,
    l: undefined,
    mobileRedirect: true,
    encryption: undefined,
    xdomainProxyUrl: undefined,
    azureWorkaround: false,
    preloadPDFWorker: true,
    workerTransportPromise: undefined,
    showLocalFilePicker: false,
    pdfnet: false,
    useDownloader: true,
    showToolbarControl: undefined,
    showPageHistoryButtons: true,
    html5Options: {},
    html5MobileOptions: {}
};


/**
 * Contains all posible modes for fitting/zooming pages to the viewer.
 * The behavior may vary depending on the {@link PDFTron.WebViewer.LayoutMode}.
 * @readonly
 * @namespace FitModes are specialized modes for specifying the zoom level of the document.
 * @enum {string}
 */
PDFTron.WebViewer.FitMode = {
    /**
     *
     * A fit mode where the zoom level is fixed to the width of the page.
     */
    FitWidth: 'FitWidth',
    /**
     * A fit mode where the zoom level is fixed to the height of the page.
     */
    FitHeight: 'FitHeight',
    /**
     * A fit mode where the zoom level is fixed to the width or height of the page, whichever is smaller.
     */
    FitPage: 'FitPage',
    /**
     * A fit mode where the zoom level is not fixed.
     */
    Zoom: 'Zoom'
};

//unused
PDFTron.WebViewer.SearchMode = {
    CaseSensitive: 1,
    WholeWord: 2,
    SearchUp: 4,
    PageStop: 8,
    ProvideQuads: 16,
    AmbientString: 32
};


/**
 * Creates a new PDFTron.WebViewer.User
 * @class A utility class to help manage user permissions for annotations.
 * @param {string} username the unique name used to identify the user.
 * @param {Boolean} isAdmin indicates if the user has administrative permissions.
 * @param {Boolean} isReadOnly indicates if the user only has read-only permissions.
 */
PDFTron.WebViewer.User = function(username, isAdmin, isReadOnly) {
    this.username = username;

    if (typeof isAdmin !== 'undefined') {
        this.isAdmin = isAdmin;
    } else {
        this.isAdmin = false;
    }

    if (typeof isReadOnly !== 'undefined') {
        this.isReadOnly = isReadOnly;
    } else {
        this.isReadOnly = false;
    }
};


