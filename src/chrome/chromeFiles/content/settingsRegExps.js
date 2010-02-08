/**************************************************************************************************/
/*  Create Date: 2006-11-14                                                                       */
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



RExT.settings.Observer = {
  // Triggers on assertion to the RDF data source
  onAssert:           function(oDataSource,oSource,oPredicate,oTarget) {
    if(!document)
      return;

    document.getElementById('editExpression').disabled   = false;
    document.getElementById('removeExpression').disabled = false;
    document.getElementById('editExpression').addEventListener('click',RExT.settings.savedRegExps.editRegExp,false);
    document.getElementById('removeExpression').addEventListener('click',RExT.settings.savedRegExps.removeRegExp,false);
    document.getElementById('savedRegExps').addEventListener('dblclick',RExT.settings.savedRegExps.editRegExp,false);
  },

  // Triggers on unassertion to the RDF data source
  onUnassert:         function(oDataSource,oSource,oPredicate,oTarget) {
    if(typeof(Components) == 'undefined')
      return;

    var oRDFService               = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                              .getService(Components.interfaces.nsIRDFService);
    var oRDFSavedRegExpsContainer = Components.classes['@mozilla.org/rdf/container;1'].getService()
                                              .QueryInterface(Components.interfaces.nsIRDFContainer);
    var oRDFContainerUtils        = Components.classes["@mozilla.org/rdf/container-utils;1"]
                                              .getService(Components.interfaces.nsIRDFContainerUtils);
    var oRDFSavedRegExps          = oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var oEditExpression           = document.getElementById('editExpression');
    var oRemoveExpression         = document.getElementById('removeExpression');
    var oSavedRegExps             = document.getElementById('savedRegExps');
    var bSavedRegExpsExist        = false;

    oRDFSavedRegExpsContainer.Init(oDataSource,oRDFSavedRegExps);

    bSavedRegExpsExist         = oRDFSavedRegExpsContainer.GetElements().hasMoreElements();
    oEditExpression.disabled   = !bSavedRegExpsExist;
    oRemoveExpression.disabled = !bSavedRegExpsExist;
    if(!bSavedRegExpsExist) {
      oEditExpression.removeEventListener('click',RExT.settings.savedRegExps.editRegExp,false);
      oRemoveExpression.removeEventListener('click',RExT.settings.savedRegExps.removeRegExp,false);
      oSavedRegExps.removeEventListener('dblclick',RExT.settings.savedRegExps.editRegExp,false);
    } else
      oSavedRegExps.currentIndex = 0;
  },
  onChange:           function(oDataSource,oSource,oPredicate,oOldTarget,oNewTarget) {},
  onMove:             function(oDataSource,oOldSource,oNewSource,oPredicate,oTarget) {},
  onBeginUpdateBatch: function(oDataSource) {},
  onEndUpdateBatch:   function(oDataSource) {}
};



RExT.settings.savedRegExps = {
  // Initialises the saved regular expressions inside the settings dialog
  init: function() {
    RExT.savedRegExps.init();

    var oAddExpression    = document.getElementById('addExpression');
    var oEditExpression   = document.getElementById('editExpression');
    var oRemoveExpression = document.getElementById('removeExpression');
    var oSavedRegExps     = document.getElementById('savedRegExps');

    // Change data source path to profile directory
    oSavedRegExps.datasources = RExT.savedRegExps.getSavedRegExpsFilePathURL();

    if(RExT.savedRegExps.getSavedRegExps() == 0) {
      oEditExpression.disabled   = true;
      oRemoveExpression.disabled = true;
    } else {
      oEditExpression.addEventListener('click',RExT.settings.savedRegExps.editRegExp,false);
      oRemoveExpression.addEventListener('click',RExT.settings.savedRegExps.removeRegExp,false);
      oSavedRegExps.addEventListener('dblclick',RExT.settings.savedRegExps.editRegExp,false);
    }

    oAddExpression.addEventListener('click',RExT.settings.savedRegExps.addRegExp,false);

    RExT.savedRegExps.oDataSource.AddObserver(RExT.settings.Observer);
  },



  // Manipulates a regular expression
  manipulate: function(sType) {
    var oTree               = null;
    var sSelectedRegExpName = '';
    var bSavedRegExpsExist  = false;

    // Switch by regular expression manipulation type
    switch(sType) {
      case 'ADD':
        window.openDialog('chrome://rext/content/editSavedRegExp.xul','','chrome');
        break;

      case 'EDIT':
        oTree               = document.getElementById('savedRegExps');
        sSelectedRegExpName = oTree.view.getCellText(oTree.view.selection.currentIndex,oTree.columns.getColumnAt(0));
        window.openDialog('chrome://rext/content/editSavedRegExp.xul','','chrome',RExT.savedRegExps.getSavedRegExp(sSelectedRegExpName));
        break;

      case 'REMOVE':
        oTree = document.getElementById('savedRegExps');
        if(oTree.view.selection.currentIndex != -1) {
          sSelectedRegExpName = oTree.view.getCellText(oTree.view.selection.currentIndex,oTree.columns.getColumnAt(0));
          RExT.savedRegExps.removeRegExp(RExT.savedRegExps.getSavedRegExp(sSelectedRegExpName));
        }
        break;
    }
  },



  // Saves a regular expression
  addRegExp:    function(){ RExT.settings.savedRegExps.manipulate('ADD'); },
  // Edits a saved regular expression
  editRegExp:   function(){ RExT.settings.savedRegExps.manipulate('EDIT'); },
  // Removes a saved regular expression
  removeRegExp: function(){ RExT.settings.savedRegExps.manipulate('REMOVE'); }
};