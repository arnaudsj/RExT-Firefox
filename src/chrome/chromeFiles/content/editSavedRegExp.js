/**************************************************************************************************/
/*  Create Date: 2008-02-27                                                                       */
/*  Last Change: 2008-03-12                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



// Create RExT class, if it doesn't exist yet
if(!RExT)
  var RExT = {};
// Create RExT settings class, if it doesn't exist yet
if(!RExT.settings)
  RExT.settings = {};



RExT.settings.editSavedRegExp = {
  oRegExp: null,



  // Initialises the dialog for editing a saved regular expression
  init: function() {
    RExT.savedRegExps.init();

    if(window.arguments && window.arguments.length > 0) {
      RExT.settings.editSavedRegExp.oRegExp = window.arguments[0];

      document.getElementById('savedRegExpName').value            = RExT.settings.editSavedRegExp.oRegExp.sName;
      document.getElementById('savedRegExpExpression').value      = RExT.settings.editSavedRegExp.oRegExp.sExpression;
      document.getElementById('savedRegExpCaseSensitive').checked = RExT.settings.editSavedRegExp.oRegExp.bCaseSensitive;
      document.getElementById('savedRegExpGlobal').checked        = RExT.settings.editSavedRegExp.oRegExp.bGlobal;
      document.getElementById('savedRegExpMultiline').checked     = RExT.settings.editSavedRegExp.oRegExp.bMultiline;
      document.getElementById('savedRegExpReplace').checked       = (RExT.settings.editSavedRegExp.oRegExp.sReplacement != null ? true : false);
      document.getElementById('savedRegExpReplacement').value     = (RExT.settings.editSavedRegExp.oRegExp.sReplacement != null ? RExT.settings.editSavedRegExp.oRegExp.sReplacement : '');
      document.getElementById('savedRegExpReplacement').disabled  = (RExT.settings.editSavedRegExp.oRegExp.sReplacement == null ? true : false);
    } else
      document.getElementById('savedRegExpReplacement').disabled  = true;
    document.getElementById('savedRegExpReplace').addEventListener('click',RExT.settings.editSavedRegExp.toggleReplacementActivation,false);
  },



  // Toggles the activation of the replacement text box
  toggleReplacementActivation: function() {
    var oReplacement = document.getElementById('savedRegExpReplacement');

    oReplacement.disabled = !oReplacement.disabled;
  },



  // Saves the regular expression
  save: function() {
    var oNewRegExp = new RExT.regExp(document.getElementById('savedRegExpName').value,
                                     document.getElementById('savedRegExpExpression').value,
                                     (document.getElementById('savedRegExpCaseSensitive').checked ? 'i' : '')+
                                     (document.getElementById('savedRegExpGlobal').checked ? 'g' : '')+
                                     (document.getElementById('savedRegExpMultiline').checked ? 'm' : ''),
                                     document.getElementById('savedRegExpReplace').checked ? document.getElementById('savedRegExpReplacement').value : null);

    if(oNewRegExp.sName == '') {
      alert(RExT.getLocaleString('enterNameHint'));
      document.getElementById('savedRegExpName').focus();
      return false;
    }

    if(oNewRegExp.sExpression == '') {
      alert(RExT.getLocaleString('enterExpressionHint'));
      document.getElementById('savedRegExpExpression').focus();
      return false;
    }

    if(!this.oRegExp || this.oRegExp.sName == '') {
      var aSavedRegExps = RExT.savedRegExps.getSavedRegExps();
      for(var i=0; i<aSavedRegExps.length; i++) {
        if(aSavedRegExps[i].sName == oNewRegExp.sName) {
          alert(RExT.getLocaleString('expressionExistsHint'));
          document.getElementById('savedRegExpName').focus();
          return false;
        }
      }

      RExT.savedRegExps.addRegExp(oNewRegExp);
    } else
      RExT.savedRegExps.editRegExp(this.oRegExp,oNewRegExp);

    window.close();

    return true;
  },



  // Cancels the regular expression editing
  cancel: function() {}
};



// Add event listeners of the dialog for editing saved regular expressions
window.addEventListener('load',RExT.settings.editSavedRegExp.init,false);
window.addEventListener('dialogaccept',function(oEvent){ oEvent.preventDefault(); RExT.settings.editSavedRegExp.save(); },false);
window.addEventListener('dialogcancel',RExT.settings.editSavedRegExp.cancel,false);