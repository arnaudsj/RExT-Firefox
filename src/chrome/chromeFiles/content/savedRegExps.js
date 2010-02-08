/**************************************************************************************************/
/*  Create Date: 2006-11-14                                                                       */
/*  Last Change: 2008-02-20                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



const sREXT_SAVED_REG_EXPS_FILE_NAME = 'savedRegExps.rdf';



// Create RExT class, if it doesn't exist yet
if(!RExT)
  var RExT = {};



RExT.regExp = function(sName,sExpression,sFlags,sReplacement) {
  this.sName          = sName;
  this.sExpression    = sExpression;
  this.bCaseSensitive = (sFlags.match(/i/) ? true : false);
  this.bGlobal        = (sFlags.match(/g/) ? true : false);
  this.bMultiline     = (sFlags.match(/m/) ? true : false);
  this.sReplacement   = sReplacement;
};



RExT.savedRegExps = {
  oRDFService: null,
  oDataSource: null,



  // Initialises the saved regular expressions
  init: function() {
    this.oRDFService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                 .getService(Components.interfaces.nsIRDFService);
    this.oDataSource = this.getDataSource();
    //this.getSavedRegExps();
  },



  // Returns the data source
  getDataSource: function() {
    var oDataSourceFile     = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    var sProfileFilePath    = this.getSavedRegExpsFilePath();
    var sChromeFilePathURL  = 'chrome://rext/content/'+sREXT_SAVED_REG_EXPS_FILE_NAME;
    var sProfileFilePathURL = this.getSavedRegExpsFilePathURL();

    oDataSourceFile.initWithPath(sProfileFilePath);

    if(oDataSourceFile.exists()) {
      oRDFDataSource = this.oRDFService.GetDataSourceBlocking(sProfileFilePathURL);
    } else {
      oRDFDataSource = this.oRDFService.GetDataSourceBlocking(sChromeFilePathURL);
      oRDFDataSource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
      oRDFDataSource.FlushTo(sProfileFilePathURL);
      oRDFDataSource = this.oRDFService.GetDataSourceBlocking(sProfileFilePathURL);
    }

    return oRDFDataSource;
  },



  // Returns the file path inside the profile directory for the saved regular expressions
  getSavedRegExpsFilePath: function() {
    return RExT.OSPathFormat(RExT.getProfileDir().path+'/'+sREXT_SAVED_REG_EXPS_FILE_NAME);
  },



  // Returns the file path inside the profile directory for the saved regular expressions
  getSavedRegExpsFilePathURL: function() {
    var oFileHandler = Components.classes["@mozilla.org/network/io-service;1"]
                                 .getService(Components.interfaces.nsIIOService);

    return oFileHandler.newFileURI(RExT.getProfileDir()).spec+sREXT_SAVED_REG_EXPS_FILE_NAME;
  },



  // Returns the saved regular expressions
  getSavedRegExps: function() {
    var oRDFSavedRegExpsContainer = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var oRDFSavedRegExps          = this.oDataSource.ArcLabelsOut(oRDFSavedRegExpsContainer);
    var oRDFName                  = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/name');
    var oRDFExpression            = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/expression');
    var oRDFCaseSensitive         = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/caseSensitive');
    var oRDFGlobal                = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/global');
    var oRDFMultiline             = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/multiline');
    var oRDFReplacement           = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/replacement');
    var aSavedRegExps             = new Array();

    while(oRDFSavedRegExps.hasMoreElements()){
      var oRDFSavedRegExpContainer = oRDFSavedRegExps.getNext();
      var oRDFSavedRegExp          = this.oDataSource.GetTarget(oRDFSavedRegExpsContainer,oRDFSavedRegExpContainer,true);

      if(oRDFSavedRegExp instanceof Components.interfaces.nsIRDFResource) {
        var oRDFSavedRegExpName          = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFName,true);
        var oRDFSavedRegExpExpression    = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFExpression,true);
        var oRDFSavedRegExpCaseSensitive = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFCaseSensitive,true);
        var oRDFSavedRegExpGlobal        = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFGlobal,true);
        var oRDFSavedRegExpMultiline     = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFMultiline,true);
        var oRDFSavedRegExpReplacement   = this.oDataSource.GetTarget(oRDFSavedRegExp,oRDFReplacement,true);
        var sSavedRegExpName             = '';
        var sSavedRegExpExpression       = '';
        var sSavedRegExpFlags            = '';
        var sSavedRegExpReplacement      = null;

        if(oRDFSavedRegExpName instanceof Components.interfaces.nsIRDFLiteral)
          sSavedRegExpName = oRDFSavedRegExpName.Value;
        else
          continue;

        if(oRDFSavedRegExpExpression instanceof Components.interfaces.nsIRDFLiteral)
          sSavedRegExpExpression = oRDFSavedRegExpExpression.Value;

        if(oRDFSavedRegExpCaseSensitive instanceof Components.interfaces.nsIRDFLiteral && oRDFSavedRegExpCaseSensitive.Value == 1)
          sSavedRegExpFlags += 'i';
        if(oRDFSavedRegExpGlobal instanceof Components.interfaces.nsIRDFLiteral && oRDFSavedRegExpGlobal.Value == 1)
          sSavedRegExpFlags += 'g';
        if(oRDFSavedRegExpMultiline instanceof Components.interfaces.nsIRDFLiteral && oRDFSavedRegExpMultiline.Value == 1)
          sSavedRegExpFlags += 'm';

        if(oRDFSavedRegExpReplacement instanceof Components.interfaces.nsIRDFLiteral)
          sSavedRegExpReplacement = oRDFSavedRegExpReplacement.Value;

        aSavedRegExps.push(new RExT.regExp(sSavedRegExpName,sSavedRegExpExpression,sSavedRegExpFlags,sSavedRegExpReplacement));
      }
    }

    if(bREXT_DEBUG_MODE) {
      for(var i=0; i<aSavedRegExps.length; i++)
        alert(aSavedRegExps[i].sName+'\n'+
              aSavedRegExps[i].sExpression+'\n'+
              aSavedRegExps[i].bCaseSensitive+'\n'+
              aSavedRegExps[i].bGlobal+'\n'+
              aSavedRegExps[i].bMultiline+'\n'+
              aSavedRegExps[i].sReplacement);
    }

    return aSavedRegExps;
  },



  // Returns a saved regular expression
  getSavedRegExp: function(sName) {
    var aSavedRegExps = this.getSavedRegExps();
    var oSavedRegExp  = new Array();

    for(var i=0; i<aSavedRegExps.length; i++) {
      if(aSavedRegExps[i].sName == sName) {
        oSavedRegExp = aSavedRegExps[i];
        break;
      }
    }

    return oSavedRegExp;
  },



  // Adds a regular expression to the datasource
  addRegExp: function(oRegExp) {
    var oRDFSavedRegExpsContainer = Components.classes['@mozilla.org/rdf/container;1'].getService()
                                              .QueryInterface(Components.interfaces.nsIRDFContainer);
    var oRDFSavedRegExps          = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var oRDFListElement           = this.oRDFService.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#li');
    var oRDFRegExp                = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#'+oRegExp.sName);
    var oRDFName                  = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/name');
    var oRDFExpression            = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/expression');
    var oRDFCaseSensitive         = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/caseSensitive');
    var oRDFGlobal                = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/global');
    var oRDFMultiline             = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/multiline');
    var oRDFReplacement           = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/replacement');
    var oRDFNameLiteral           = this.oRDFService.GetLiteral(oRegExp.sName);
    var oRDFExpressionLiteral     = this.oRDFService.GetLiteral(oRegExp.sExpression);
    var oRDFCaseSensitiveLiteral  = this.oRDFService.GetLiteral(oRegExp.bCaseSensitive ? 1 : 0);
    var oRDFGlobalLiteral         = this.oRDFService.GetLiteral(oRegExp.bGlobal ? 1 : 0);
    var oRDFMultilineLiteral      = this.oRDFService.GetLiteral(oRegExp.bMultiline ? 1 : 0);
    var oRDFReplacementLiteral    = null;

    oRDFSavedRegExpsContainer.Init(this.oDataSource,oRDFSavedRegExps);
    oRDFSavedRegExpsContainer.AppendElement(oRDFRegExp,true);
    this.oDataSource.Assert(oRDFRegExp,oRDFName,oRDFNameLiteral,true);
    this.oDataSource.Assert(oRDFRegExp,oRDFExpression,oRDFExpressionLiteral,true);
    this.oDataSource.Assert(oRDFRegExp,oRDFCaseSensitive,oRDFCaseSensitiveLiteral,true);
    this.oDataSource.Assert(oRDFRegExp,oRDFGlobal,oRDFGlobalLiteral,true);
    this.oDataSource.Assert(oRDFRegExp,oRDFMultiline,oRDFMultilineLiteral,true);
    if(oRegExp.sReplacement != null) {
      oRDFReplacementLiteral = this.oRDFService.GetLiteral(oRegExp.sReplacement);
      this.oDataSource.Assert(oRDFRegExp,oRDFReplacement,oRDFReplacementLiteral,true);
    }

    this.oDataSource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    this.oDataSource.Flush();
  },



  // Edits a regular expression in the datasource
  editRegExp: function(oOldRegExp,oNewRegExp) {
    var oRDFSavedRegExps            = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var oRDFRegExp                  = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#'+oOldRegExp.sName);
    var oRDFName                    = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/name');
    var oRDFExpression              = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/expression');
    var oRDFCaseSensitive           = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/caseSensitive');
    var oRDFGlobal                  = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/global');
    var oRDFMultiline               = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/multiline');
    var oRDFReplacement             = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/replacement');
    var oRDFNameLiteralOld          = this.oRDFService.GetLiteral(oOldRegExp.sName);
    var oRDFNameLiteralNew          = this.oRDFService.GetLiteral(oNewRegExp.sName);
    var oRDFExpressionLiteralOld    = this.oRDFService.GetLiteral(oOldRegExp.sExpression);
    var oRDFExpressionLiteralNew    = this.oRDFService.GetLiteral(oNewRegExp.sExpression);
    var oRDFCaseSensitiveLiteralOld = this.oRDFService.GetLiteral(oOldRegExp.bCaseSensitive ? 1 : 0);
    var oRDFCaseSensitiveLiteralNew = this.oRDFService.GetLiteral(oNewRegExp.bCaseSensitive ? 1 : 0);
    var oRDFGlobalLiteralOld        = this.oRDFService.GetLiteral(oOldRegExp.bGlobal ? 1 : 0);
    var oRDFGlobalLiteralNew        = this.oRDFService.GetLiteral(oNewRegExp.bGlobal ? 1 : 0);
    var oRDFMultilineLiteralOld     = this.oRDFService.GetLiteral(oOldRegExp.bMultiline ? 1 : 0);
    var oRDFMultilineLiteralNew     = this.oRDFService.GetLiteral(oNewRegExp.bMultiline ? 1 : 0);
    var oRDFOldReplacementLiteral   = null;
    var oRDFNewReplacementLiteral   = null;

    this.oDataSource.Change(oRDFRegExp,oRDFName,oRDFNameLiteralOld,oRDFNameLiteralNew);
    this.oDataSource.Change(oRDFRegExp,oRDFExpression,oRDFExpressionLiteralOld,oRDFExpressionLiteralNew);
    this.oDataSource.Change(oRDFRegExp,oRDFCaseSensitive,oRDFCaseSensitiveLiteralOld,oRDFCaseSensitiveLiteralNew);
    this.oDataSource.Change(oRDFRegExp,oRDFGlobal,oRDFGlobalLiteralOld,oRDFGlobalLiteralNew);
    this.oDataSource.Change(oRDFRegExp,oRDFExpression,oRDFExpressionLiteralOld,oRDFExpressionLiteralNew);
    this.oDataSource.Change(oRDFRegExp,oRDFMultiline,oRDFMultilineLiteralOld,oRDFMultilineLiteralNew);
    if(oOldRegExp.sReplacement != null && oNewRegExp.sReplacement != null) {
      oRDFOldReplacementLiteral = this.oRDFService.GetLiteral(oOldRegExp.sReplacement);
      oRDFNewReplacementLiteral = this.oRDFService.GetLiteral(oNewRegExp.sReplacement);
      this.oDataSource.Change(oRDFRegExp,oRDFReplacement,oRDFOldReplacementLiteral,oRDFNewReplacementLiteral,true);
    } else if(oOldRegExp.sReplacement != null && oNewRegExp.sReplacement == null) {
      oRDFOldReplacementLiteral = this.oRDFService.GetLiteral(oOldRegExp.sReplacement);
      this.oDataSource.Unassert(oRDFRegExp,oRDFReplacement,oRDFOldReplacementLiteral);
    } else if (oOldRegExp.sReplacement == null && oNewRegExp.sReplacement != null) {
      oRDFNewReplacementLiteral = this.oRDFService.GetLiteral(oNewRegExp.sReplacement);
      this.oDataSource.Assert(oRDFRegExp,oRDFReplacement,oRDFNewReplacementLiteral,true);
    }

    this.oDataSource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    this.oDataSource.Flush();
  },



  // Removes a regular expression from the datasource
  removeRegExp: function(oRegExp) {
    var oRDFSavedRegExpsContainer = Components.classes['@mozilla.org/rdf/container;1'].getService()
                                              .QueryInterface(Components.interfaces.nsIRDFContainer);
    var oRDFSavedRegExps          = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var oRDFRegExp                = this.oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#'+oRegExp.sName);
    var oRDFListElement           = this.oRDFService.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#li');
    var oRDFName                  = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/name');
    var oRDFExpression            = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/expression');
    var oRDFCaseSensitive         = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/caseSensitive');
    var oRDFGlobal                = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/global');
    var oRDFMultiline             = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/multiline');
    var oRDFReplacement           = this.oRDFService.GetResource('http://sebastianzartner.de/RExT/replacement');
    var oRDFNameLiteral           = this.oRDFService.GetLiteral(oRegExp.sName);
    var oRDFExpressionLiteral     = this.oRDFService.GetLiteral(oRegExp.sExpression);
    var oRDFCaseSensitiveLiteral  = this.oRDFService.GetLiteral(oRegExp.bCaseSensitive ? 1 : 0);
    var oRDFGlobalLiteral         = this.oRDFService.GetLiteral(oRegExp.bGlobal ? 1 : 0);
    var oRDFMultilineLiteral      = this.oRDFService.GetLiteral(oRegExp.bMultiline ? 1 : 0);
    var oRDFReplacementLiteral    = null;

    this.oDataSource.Unassert(oRDFRegExp,oRDFName,oRDFNameLiteral);
    this.oDataSource.Unassert(oRDFRegExp,oRDFExpression,oRDFExpressionLiteral);
    this.oDataSource.Unassert(oRDFRegExp,oRDFCaseSensitive,oRDFCaseSensitiveLiteral);
    this.oDataSource.Unassert(oRDFRegExp,oRDFGlobal,oRDFGlobalLiteral);
    this.oDataSource.Unassert(oRDFRegExp,oRDFMultiline,oRDFMultilineLiteral);
    if(oRegExp.sReplacement != null) {
      oRDFReplacementLiteral = this.oRDFService.GetLiteral(oRegExp.sReplacement);
      this.oDataSource.Unassert(oRDFRegExp,oRDFReplacement,oRDFReplacementLiteral);
    }
    oRDFSavedRegExpsContainer.Init(this.oDataSource,oRDFSavedRegExps);
    oRDFSavedRegExpsContainer.RemoveElement(oRDFRegExp,true);

    this.oDataSource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    this.oDataSource.Flush();
  }
};