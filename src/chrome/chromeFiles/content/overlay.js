/**************************************************************************************************/
/*  Create Date: 2006-03-20                                                                       */
/*  Last Change: 2008-03-12                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1                                                                              */
/**************************************************************************************************/



RExT.overlay = {
  // Opens the main RExT window
  openRExTWindow: function() {
    window.openDialog('chrome://rext/content/main.xul', '', 'chrome,dialog=0,resizable=1,left=30,top=30,width=450,height=600');
  }
};