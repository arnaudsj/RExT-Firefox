/**************************************************************************************************/
/*  Create Date: 2006-02-21                                                                       */
/*  Last Change: 2008-03-12                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



const bREXT_DEBUG_MODE = false;



var RExT = {
  oLocaleStrings: Components.classes["@mozilla.org/intl/stringbundle;1"]
                            .getService(Components.interfaces.nsIStringBundleService)
                            .createBundle("chrome://rext/locale/rext.properties"),



  // Opens a window and loads the specified URL
  loadURL: function(sURL) {
    var oPref         = Components.classes["@mozilla.org/preferences-service;1"]
                                  .getService(Components.interfaces.nsIPrefBranch);
    var oParentWindow = null;

    if(window.opener)
      oParentWindow = window.opener.opener ? window.opener.opener : window.opener;

    if(oParentWindow && oParentWindow.openUILinkIn) {
      var iNewWindowPref = oPref.getIntPref('browser.link.open_newwindow');
      oParentWindow.openUILinkIn(sURL,(iNewWindowPref == 3 ? 'tab' : 'window'));
    } else
      openDialog("chrome://browser/content/browser.xul","_blank","chrome,all,dialog=no",sURL,null,null);
  },



  // Formats a path by using operating system specifications
  OSPathFormat: function(sPath) {
    if(navigator.platform.match(/win/i))
      return sPath.replace(/\//g,'\\');
    else if(navigator.platform.match(/linux/i))
      return sPath.replace(/\\/g,'/');
    else
      return sPath;
  },



  // Returns the profile directory
  getProfileDir: function() {
    return(Components.classes['@mozilla.org/file/directory_service;1']
                      .getService(Components.interfaces.nsIProperties)
                      .get('ProfD', Components.interfaces.nsIFile));
  },



  // Returns a locale string
  getLocaleString: function(sName,aArguments) {
    if(aArguments instanceof Array && aArguments.length)
      return RExT.oLocaleStrings.formatStringFromName(sName,aArguments,1);

    return RExT.oLocaleStrings.GetStringFromName(sName);
  },



  // Copies a string to the clipboard
  copyToClipboard: function(sString) {
    var oClipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                               .getService(Components.interfaces.nsIClipboardHelper);

    oClipboard.copyString(sString);
  }
};