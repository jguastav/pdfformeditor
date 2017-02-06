/*jshint unused:false */
(function(exports) {
    'use strict';
    exports.PDFTron = exports.PDFTron || {};
    exports.PDFTron.WebViewer = exports.PDFTron.WebViewer || {};
    exports.PDFTron.WebViewer.ToolMode = {
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
         * @name PDFTron.WebViewer.ToolMode.AnnotationCreatePolygonCloud
         */
        AnnotationCreatePolygonCloud: "AnnotationCreatePolygonCloud",
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
     * These functions should be overridden in a ReaderControl so that WebViewer can interact with it
     * @name WebViewerInterface
     * @namespace The functions that WebViewer uses to interface with ReaderControl
     */
    var WebViewerInterface = function() {
    };

    var unsupportedFunction = function() {
        console.warn("Unsupported method for this viewer type.");
    };


    WebViewerInterface.prototype = {
        /**
         * Controls if the document's Zoom property will be adjusted so that the height of the current page or panel
         * will exactly fit into the available space.
         * Not supported by HTML5 viewers.
         */
        fitHeight: function() {
            unsupportedFunction();
        },
        /**
         * Controls if the document's Zoom property will be adjusted so that the width and height of the current page or panel
         * will fit into the available space.
         * Not supported for mobile viewer.
         */
        fitPage: function() {
            unsupportedFunction();
        },
        /**
         * Controls if the document's Zoom property will be adjusted so that the width of the current page or panel
         * will exactly fit into the available space.
         * Not supported for mobile viewer.
         */
        fitWidth: function() {
            unsupportedFunction();
        },
        /**
         * Sets the FitMode to Zoom, where the zoom level is free from pre-defined fit modes.
         */
        fitZoom: function() {
            unsupportedFunction();
        },
        /**
         * Gets the current page number
         * @returns {integer} the current page number
         */
        getCurrentPageNumber: function() {
            unsupportedFunction();
        },
        /**
         * Sets the current page number and navigates to the specified page in the viewer.
         * @param {integer} pageNumber the new page number
         */
        setCurrentPageNumber: function(pageNumber) {
            unsupportedFunction();
        },
        /**
         * Gets the layout mode of the document.
         * Not supported for mobile viewer.
         * @return the layout mode of the document
         */
        getLayoutMode: function() {
            unsupportedFunction();
        },
        /**
         * Sets the layout mode of the document.
         * Not supported for mobile viewer.
         * @param layout the layout mode to set
         */
        setLayoutMode: function(layout) {
            unsupportedFunction();
        },
        /**
         * Gets the total page count of the loaded document
         * @returns {integer} the total page count of the loaded document
         */
        getPageCount: function() {
            unsupportedFunction();
        },
        /**
         * Gets the value whether the side window is visible or not.
         * Not supported for mobile viewer.
         * @return true if the side window is shown
         */
        getShowSideWindow: function() {
            unsupportedFunction();
        },
        /**
         * Sets the value whether the side window is visible or not.
         * Not supported for mobile viewer.
         * @param value true to show the side window
         */
        setShowSideWindow: function(value) {
            unsupportedFunction();
        },
        /**
         * Gets the current tool mode
         * @returns {object} the current tool mode
         */
        getToolMode: function() {
            unsupportedFunction();
        },
        /**
         * Sets the tool mode
         * @param {object} toolMode the object representing the tool mode
         */
        setToolMode: function(toolMode) {
            unsupportedFunction();
        },
        /**
         * Gets the current fit mode
         * @returns {object} the current fit mode
         */
        getFitMode: function() {
            unsupportedFunction();
        },
        /**
         * Sets the fit mode
         * @param {object} fitMode the object representing the fit mode
         */
        setFitMode: function(fitMode) {
            unsupportedFunction();
        },
        /**
         * Gets the current zoom level
         * @returns {number} the current zoom level in float, where 1.0 is 100%.
         */
        getZoomLevel: function() {
            unsupportedFunction();
        },
        /**
         * Sets the current zoom level
         * @param {number} zoomLevel the new zoom level, where 1.0 is 100%.
         */
        setZoomLevel: function() {
            unsupportedFunction();
        },
        /**
         * Navigates to the first page of the document
         */
        goToFirstPage: function() {
            unsupportedFunction();
        },
        /**
         * Navigates to the last page of the document
         */
        goToLastPage: function() {
            unsupportedFunction();
        },
        /**
         * Navigates to the next page of the document.
         * This method will increment the current page number by 1, regardless of display modes (where more than 1 page is displayed at a time).
         */
        goToNextPage: function() {
            unsupportedFunction();
        },
        /**
         * Navigates to the previous page of the document.
         * This method will decrement the current page number by 1, regardless of display modes (where more than 1 page is displayed at a time).
         */
        goToPrevPage: function() {
            unsupportedFunction();
        },
        /**
         * Loads a document into the WebViewer.
         * @param url url of the document to be loaded (relative urls may not work, it is recommended to use absolute urls)
         */
        loadDocument: function(url) {
            unsupportedFunction();
        },
        /**
         * Rotates the document viewer's orientation by 90 degrees clockwise.
         */
        rotateClockwise: function() {
            unsupportedFunction();
        },
        /**
         * Rotates the document viewer's orientation by 90 degrees counter clockwise.
         */
        rotateCounterClockwise: function() {
            unsupportedFunction();
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
        searchText: function(pattern, searchMode) {
            unsupportedFunction();
        }
    };

    exports.WebViewerInterface = WebViewerInterface;

})(window);