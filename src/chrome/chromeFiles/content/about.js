/**************************************************************************************************/
/*  Create Date: 2006-11-06                                                                       */
/*  Last Change: 2008-03-12                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



// Create RExT class, if it doesn't exist yet
if(!RExT)
  var RExT = {};



RExT.about = {
  // Initialises the about dialog
  init: function() {
    var oExtensionInfo = RExT.about.getExtensionInfo();

    document.getElementById('title').setAttribute('value',oExtensionInfo.name);
    document.getElementById('version').setAttribute('value',oExtensionInfo.version);

    document.getElementById('email').addEventListener('click',function(){ RExT.loadURL('mailto:sebastianzartner@gmx.de'); },false);
    document.getElementById('RExTHelp').addEventListener('click',function(){ RExT.loadURL('http://sebastianzartner.ath.cx/firefoxExtensions/RExT/'); },false);
    document.getElementById('regExpHelp').addEventListener('click',function(){ RExT.loadURL('http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:RegExp'); },false);
  },



  // Returns the extension information
  getExtensionInfo: function() {
    const GUID = 'regexptester@sebastianzartner.ath.cx';

    var oExtensionManager = Components.classes['@mozilla.org/extensions/manager;1'].getService(Components.interfaces.nsIExtensionManager);
    var oExtensionInfo    = oExtensionManager.getItemForID ? oExtensionManager.getItemForID(GUID) : oExtensionManager.getItemList(GUID,null,{})[0];

    return oExtensionInfo;
  }
};


// Add event listener for initialising the about dialog
window.addEventListener('load',RExT.about.init,false);