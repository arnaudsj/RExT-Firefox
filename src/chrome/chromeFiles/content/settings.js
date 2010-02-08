/**************************************************************************************************/
/*  Create Date: 2006-11-14                                                                       */
/*  Last Change: 2008-03-12                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



// Create RExT class, if it doesn't exist yet
if(!RExT)
  var RExT = {};



RExT.settings = {
  oPrefService: null,



  // Initialises the settings dialog
  init: function() {
    RExT.settings.savedRegExps.init();

    RExT.settings.oPrefService = Components.classes['@mozilla.org/preferences-service;1']
                                           .getService(Components.interfaces.nsIPrefService);

    var oRExTPrefs             = RExT.settings.oPrefService.getBranch('extensions.rext.');
    var oHighlightSpecialChars = document.getElementById('highlightSpecialChars');

    document.getElementById('updateWhileWriting').checked        = oRExTPrefs.getBoolPref('updateWhileWriting');
    document.getElementById('autoCloseBrackets').checked         = oRExTPrefs.getBoolPref('autoCloseBrackets');
    document.getElementById('highlightBackgroundColor').color    = oRExTPrefs.getCharPref('highlightBackgroundColor');
    document.getElementById('highlightTextColor').color          = oRExTPrefs.getCharPref('highlightTextColor');
    document.getElementById('displayLineBreaks').checked         = oRExTPrefs.getBoolPref('displayLineBreaks');
    document.getElementById('displaySpaces').checked             = oRExTPrefs.getBoolPref('displaySpaces');
    document.getElementById('displayTabs').checked               = oRExTPrefs.getBoolPref('displayTabs');
    oHighlightSpecialChars.checked                               = oRExTPrefs.getBoolPref('highlightSpecialChars');
    document.getElementById('specialCharsBackgroundColor').color = oRExTPrefs.getCharPref('specialCharsBackgroundColor');

    RExT.settings.toggleSpecialCharsBackgroundColorActivation();
    oHighlightSpecialChars.addEventListener('click',RExT.settings.toggleSpecialCharsBackgroundColorActivation,false);
  },



  // Toggles the activation of the special chars background color button
  toggleSpecialCharsBackgroundColorActivation: function() {
    var oRExTPrefs                   = RExT.settings.oPrefService.getBranch('extensions.rext.');
    var oSpecialCharsBackgroundColor = document.getElementById('specialCharsBackgroundColor');
    var oHighlightSpecialChars       = document.getElementById('highlightSpecialChars');

    oSpecialCharsBackgroundColor.color    = (oHighlightSpecialChars.checked ? oRExTPrefs.getCharPref('specialCharsBackgroundColor') : '#e6e6e6');
    oSpecialCharsBackgroundColor.disabled = !oHighlightSpecialChars.checked;
  },



  // Saves the current settings
  save: function() {
    var oRExTPrefs = RExT.settings.oPrefService.getBranch('extensions.rext.');

    oRExTPrefs.setBoolPref('updateWhileWriting',document.getElementById('updateWhileWriting').checked)
    oRExTPrefs.setBoolPref('autoCloseBrackets',document.getElementById('autoCloseBrackets').checked)
    oRExTPrefs.setCharPref('highlightBackgroundColor',document.getElementById('highlightBackgroundColor').color)
    oRExTPrefs.setCharPref('highlightTextColor',document.getElementById('highlightTextColor').color)
    oRExTPrefs.setBoolPref('displayLineBreaks',document.getElementById('displayLineBreaks').checked)
    oRExTPrefs.setBoolPref('displaySpaces',document.getElementById('displaySpaces').checked)
    oRExTPrefs.setBoolPref('displayTabs',document.getElementById('displayTabs').checked)
    oRExTPrefs.setBoolPref('highlightSpecialChars',document.getElementById('highlightSpecialChars').checked)
    if(document.getElementById('highlightSpecialChars').checked)
      oRExTPrefs.setCharPref('specialCharsBackgroundColor',document.getElementById('specialCharsBackgroundColor').color)

    Components.classes['@mozilla.org/preferences-service;1']
              .getService(Components.interfaces.nsIPrefService)
              .savePrefFile(null);
  },



  // Resets the settings to the default values
  reset: function() {
    var oRExTDefaultPrefs = RExT.settings.oPrefService.getDefaultBranch('extensions.rext.');

    if(confirm(RExT.getLocaleString('resetSettingsQuestion'))) {
      document.getElementById('updateWhileWriting').checked        = oRExTDefaultPrefs.getBoolPref('updateWhileWriting');
      document.getElementById('autoCloseBrackets').checked         = oRExTDefaultPrefs.getBoolPref('autoCloseBrackets');
      document.getElementById('highlightBackgroundColor').color    = oRExTDefaultPrefs.getCharPref('highlightBackgroundColor');
      document.getElementById('highlightTextColor').color          = oRExTDefaultPrefs.getCharPref('highlightTextColor');
      document.getElementById('displayLineBreaks').checked         = oRExTDefaultPrefs.getBoolPref('displayLineBreaks');
      document.getElementById('displaySpaces').checked             = oRExTDefaultPrefs.getBoolPref('displaySpaces');
      document.getElementById('displayTabs').checked               = oRExTDefaultPrefs.getBoolPref('displayTabs');
      document.getElementById('highlightSpecialChars').checked     = oRExTDefaultPrefs.getBoolPref('highlightSpecialChars');
      document.getElementById('specialCharsBackgroundColor').color = oRExTDefaultPrefs.getCharPref('specialCharsBackgroundColor');

      RExT.settings.toggleSpecialCharsBackgroundColorActivation();
    }
  },



  // Cancels the specified settings
  cancel: function() {}
};



// Add event listeners of the settings dialog
window.addEventListener('load',RExT.settings.init,false);
window.addEventListener('dialogaccept',RExT.settings.save,false);
window.addEventListener('dialogextra1',RExT.settings.reset,false);
window.addEventListener('dialogcancel',RExT.settings.cancel,false);