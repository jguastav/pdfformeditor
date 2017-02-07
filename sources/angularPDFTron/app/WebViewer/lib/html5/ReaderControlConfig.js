/**
 * ReaderControl config file
 * ------------------------------
 * This js file is meant to simplify configuring commonly used settings for ReaderControl.
 * For advanced customizations, feel free to modify ReaderControl.js directly.
 */


/**
 *Static configuration options for ReaderControl
 *@name config
 *@namespace ReaderControl.config
 *@memberOf ReaderControl
 *@static
 *@property {string} customScript a URL path to a custom JavaScript file that is loaded through ajax.
 *@property {string} customStyle a URL path to a custom CSS file that is loaded through ajax.
 *@property {string} serverURL a URL path to a server handler for annotation loading and saving.
 *@property {string} defaultUser the Author name that is set for every annotation created by this client if "user" is not specified in the query parameter.
 *@example Usage: define these static properties before creating a new instance of ReaderControl
 */
ReaderControl.config = {
    //customScript : 'defaultScriptExtension.js',
    // customStyle : 'defaultStyleExtension.css',
    serverURL : "annotationHandler.php",    //The server-side script that handles saving/loading of annotations
    defaultUser: "Guest"                    //The default username for annotations created
};

/**
     *Static UI configuration options for ReaderControl
     *@name ui
     *@namespace ReaderControl.config.ui
     *@memberOf ReaderControl.config
     *@static
     *@property {boolean} [hideSidePanel=false] hides the side panel
     *@property {boolean} [hideAnnotationPanel=false] hides the side panel's annotation tab
     *@property {boolean} [hideControlBar=false] hides the top control bar
     *@property {boolean} [hideDisplayModes=false] hides the display mode dropdown button in the control bar
     *@property {boolean} [hideZoom=false] hides the zoom selection controls in the control bar
     *@property {boolean} [hideTextSearch=false] hides the text search controls in the control bar
     *@property {boolean} [hidePrint=false] hides the print button
     */
ReaderControl.config.ui = {
    //    // main UI elements
    hideAnnotationPanel: false,
    hideControlBar: false,
    hideSidePanel: false,
                
    // UI subelements
    hideDisplayModes: false,
    hideZoom: false,
    hideTextSearch: false,
    hidePrint: false
};