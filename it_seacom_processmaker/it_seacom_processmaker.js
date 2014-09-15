/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is: Zimbra Collaboration Suite.
 *
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 *
 * Contributor(s): @autor Ikbel Harbaoui <ikbelh@seacom.it>, Nicola Pagni <nicolap@seacom.it>
 *
 * ***** END LICENSE BLOCK *****
 */


function it_seacom_processmakerHandlerObject() {};

it_seacom_processmakerHandlerObject.prototype = new ZmZimletBase();
it_seacom_processmakerHandlerObject.prototype.constructor = it_seacom_processmakerHandlerObject;

var processMaker = it_seacom_processmakerHandlerObject;

//************************************************************************************************
//****************************** Start method Zimbra framework **********************************
//************************************************************************************************

/** Init method
 */
processMaker.prototype.init = function(){
    this.prevSelection = null;
    this._browser = this._getBrowser();
    this._createPmTab();
    this._doubleClickedFlag = false;
    this._checkAndCreateTag();	//check that the tag of PM has been created, otherwise I create it
    this.pMakerAPI = new processMakerAPI(this);
    var postCallback = new AjxCallback(this, this._initSchedulers);
    this.pMakerAPI._login(postCallback, true);
};

/** Called by the Zimbra framework when the panel item was double clicked
 */
processMaker.prototype.doubleClicked = function(){
    //I start the process list 
    this._doubleClickedFlag = true;
    this._getProcessList();
};

/** Called by the Zimbra framework when the panel item was clicked
 */
processMaker.prototype.singleClicked = function(){};

/** Called by the Zimbra framework for define the actions of the zimlet panel
 *	
 *	@param {boolean} itemId : the selected menu item Id
 */
processMaker.prototype.menuItemSelected = function(itemId){
    switch (itemId) {
		case "PREFERENCES_PM": {	
			this.createPropertyEditor(new AjxCallback(this, this._showYesNoReloadDialog));
			break;
		}
			case "REMINDER": {	
				this._openReminderDialog();
				break;
		}
		// case "REPORTS": {	
			// this._openReports();
			// break;
		// }
		case "UNASSIGNED": {	
			this._openUnassignedTab();
			break;
		}
		case "INBOX": {	
			if(this.pMakerAPI.sessionId){	
				this._flagRepeat = 0;
				var callback = new AjxCallback(this, this._caseListCallback, "TO_DO");
				this.pMakerAPI._caseList(callback);
			}else{
				this.displayStatusMessage(this.getMessage("userNotLogged"));
				this.createPropertyEditor(new AjxCallback(this, this._showYesNoReloadDialog));
			}
			break;
		}
		case "DRAFT": {	
			if(this.pMakerAPI.sessionId){	
				this._flagRepeat = 0;
				var callback = new AjxCallback(this, this._caseListCallback, "DRAFT");
				this.pMakerAPI._caseList(callback);
			}else{
				this.displayStatusMessage(this.getMessage("userNotLogged"));
				this.createPropertyEditor(new AjxCallback(this, this._showYesNoReloadDialog));
			}
			break;
		}
		case "ABOUT_SEACOM": {
			this._createAboutPage("SiFlow", "1.0", "2014");
			break;
		}
    }
};

processMaker.prototype._createAboutPage = function(zimletName, zimletVer, CopyrightYear){
	var view = new DwtComposite(this.getShell()); 
	view.setSize("350", "230");
	var html = new Array();
	html.push(
		"<div class='center-holder'>",
			"<div class='center'>",
				"<p class='big'>Zimlet " + zimletName + " " + zimletVer + "</p>",
				"<p>The Zimlet of ProcessMaker by Seacom Srl</p>",
			"</div>",
		"</div>",
		"<div class='med center-holder'>",
			"<div class='center' id='zpm_logo'>",
			"</div>",
		"</div>",
		"<div class='med center-holder'>",
			"<p>Copyright " + CopyrightYear + " Seacom Srl<br /><a href='http://www.seacom.it'>www.seacom.it</a></p>",
		"</div>"
	);
	view.getHtmlElement().innerHTML = html.join("");
	var dialog = new ZmDialog({
		title : this.getMessage("about_poweredByTitle"), 
		view : view, 
		parent : this.getShell(), 
		standardButtons : [DwtDialog.OK_BUTTON]
	});
	dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() {dialog.popdown();}));
	dialog.popup(); 
}


/** Called by the Zimbra framework when we click on a message
 * 
 *	@param {ZmMailMsg} msg : the clicked message
 */
processMaker.prototype.onFindMsgObjects = function(msg){
    var selection = appCtxt.getCurrentController().getListView().getSelection()[0];
	if(selection.type == "CONV" && (!this.prevSelection ||  selection.id !== this.prevSelection.id)){
		this.currentMsg = selection.getFirstHotMsg();	
		this.prevSelection = selection;
		this._addDivPmBar();
	}
};

/** Called by the Zimbra framework when we click on a message
 * 
 *	@param {ZmMailMsg} msg : the clicked message
 */
processMaker.prototype.onMsgView = function(msg) {
	this.prevSelection = null;
    this.currentMsg = msg;
	this._addDivPmBar();
};


/** Called by the Zimbra framework when we do drag'n'drop of an email on zimlet icon
 * 
 * 	@param {ZmAppt|ZmConv|ZmContact|ZmMailMsg} zmObject : the clicked message
 */
processMaker.prototype.doDrop = function(zmObject){
    switch (zmObject.TYPE) {
        case "ZmMailMsg": {	
            if(typeof(zmObject.srcObj) == 'undefined'){
                this.displayStatusMessage(this.getMessage("errNumEmailSelected"));
            }else{
                this.currentMsg = zmObject.srcObj;
                //If it exist, recover the caseId saved in the metadata of the selected email, then I create the activity
                this._getCaseInfoMetada(this.currentMsg.id, new AjxCallback(this, this._getProcessList));
            }
            break;
        }
        case "ZmConv": {	
            if(typeof(zmObject.srcObj) == 'undefined'){
                this.displayStatusMessage(this.getMessage("errNumEmailSelected"));
            }else{
                this.currentMsg = zmObject.srcObj.getFirstHotMsg();
                //If it exist, recover the caseId saved in the metadata of the selected email, then I create the activity
                this._getCaseInfoMetada(this.currentMsg.id, new AjxCallback(this, this._getProcessList));
            }
            break;
        }
        case "ZmContact": {	
            this.displayStatusMessage(this.getMessage("ZmContactMsg"));
            break;
        }
        case "ZmAppt":	{	
            this.displayStatusMessage(this.getMessage("ZmApptMsg"));
            break;
        }
    }
};

/** Called by the Zimbra framework that add the option of PM in the context menu
 * 
 *	@param {ZmApp} app : the application
 *	@param {ZmButtonToolBar} toolbar : the toolbar
 *	@param {ZmController} controller : the application controller
 *	@param {string} viewId : the view Id
 */
processMaker.prototype.initializeToolbar = function(app, toolbar, controller, viewId){
    var ind = viewId.indexOf("-");
    var view = viewId.slice(0, (ind == -1) ? viewId.length : ind);
    if (view == ZmId.VIEW_CONVLIST || view == ZmId.VIEW_TRAD) {
        var actionMenu = controller.getActionMenu();
        if (!actionMenu.getOp("PM")) {
            var menuPM = actionMenu.createOp("PM", {
                text : "PM",
                image : "PM-panelIcon",
                enabled : true
            });
            menuPM.addSelectionListener(new AjxListener(this, this._manageSelectdItem, controller));
        }
    }
};

/** Called by the Zimbra framework that called each time the "tab" application is opened or closed.
 *
 *	@param {string} appName : the application name
 *	@param {boolean} active : if true, the application status is open; otherwise, false
 */
processMaker.prototype.appActive = function(appName, active) {
    switch(appName){
        case this._PmTab : {
            if(active == true) { //if we enter in the PM tab
                if(this.pMakerAPI.sessionId){ // To access at the PM tab, is need to do the login
                    if(this._miniCal){
                        this._isViewTabPM = true;
                        this._miniCal.style.visibility = "visible";
                    }
                    //Build PM menu in the zimlet panel (in the PM tab view)
                    if(this._isInitTabMenu == true){
                        this._isInitTabMenu = false;
                        this.buildOverview();
                    }
                    if(!this._isNewLogin && this._directClickOnTab !== false){
                        this._initPmTab();
                        this._isNewLogin = true;
                    }
                }else{
                    this._showMessage(this.getMessage("notAccessTab"), DwtMessageDialog.INFO_STYLE);
                }
            }else{ //if we exit from the PM tab
                this._isViewTabPM = false;
                if(typeof(this._miniCal) !== 'undefined' && this._casesResult && this._isSnoozed == false){
                        this._miniCal.style.visibility = "hidden";
                }
            }
            break; 
        }
    }
};

/** Called by the Zimbra framework that manage the click on link
 * 
 *	@param {Object} spanElement : the enclosing span element
 *	@param {string} contentObjText : the content object text
 *	@param {array} matchContext : the match content
 *	@param {DwtMouseEvent} canvas : the mouse click event
 */
processMaker.prototype.clicked = function(spanElement, contentObjText, matchContext, canvas) {
    this._openCaseByClick(contentObjText);	
};

//************************************************************************************************
//******************************** End method Zimbra framework **********************************
//************************************************************************************************

/** Create the PM Tab
 */
processMaker.prototype._createPmTab = function(){
    this._isInitTabMenu = true;
    // Add the PM tab (not for IE)
    if(this._browser !== 'IE'){
        this._PmTab = this.createApp("ProcessMaker", "PM-panelIcon", "ProcessMaker");
        this._isNewLogin = false;
        this._isViewTabPM = false;
    }
};

/** Show the Yes/No dialog
 */
processMaker.prototype._showYesNoReloadDialog = function() {
    var dlg = appCtxt.getYesNoMsgDialog();
    dlg.registerCallback(DwtDialog.YES_BUTTON, this._yesReloadButtonClicked, this, dlg);
    dlg.registerCallback(DwtDialog.NO_BUTTON, this._NoButtonClicked, this, dlg);
    dlg.setMessage(ZmMsg.zimletChangeRestart, DwtMessageDialog.WARNING_STYLE);
    dlg.popup();
};

/** Reload the Zimbra mail to apply the changes
 * 
 *	@param {DwtDialog} dlg : the dialog
 */
processMaker.prototype._yesReloadButtonClicked = function(dlg) {
    dlg.popdown();
    window.onbeforeunload = null;
    var url = AjxUtil.formatUrl({});
    ZmZimbraMail.sendRedirect(url);
};


/** Manage the case we use an email from context menu
 * 
 *	@param {ZmController} controller : the application controller
 */
processMaker.prototype._manageSelectdItem = function(controller){
    var obj = controller.getCurrentView().getSelection()[0];
    if(typeof(obj) == 'undefined' || (typeof(obj.numMsgs) !== 'undefined' && (obj.toString() !== "ZmConv" && obj.numMsgs !== 1))){
        this.displayStatusMessage(this.getMessage("errNumEmailSelected"));
    }else{
        this.currentMsg = (obj.toString() == "ZmConv") ? obj.getFirstHotMsg() : obj;
        var callback = new AjxCallback(this, this._getProcessList);
        this._getCaseInfoMetada(this.currentMsg.id, callback);
    }
};

/** Processes the clicked link using an regular expression to open the pertinent case at the caseId obtained
 * 
 *      @param {String} regexp : the application controller
 */
processMaker.prototype._openCaseByClick = function(regexp) {
    if(this.pMakerAPI.sessionId){
        var tmp = (regexp) ? regexp.split(':')[1] : regexp;
        var indexStr = regexp.split('INDEX')[1];
        var caseId = tmp.substr(1, 32);
        var index = indexStr.split(':')[1]; // Prendo indeice della form
        index++;
        var ErrCallback = new AjxCallback(this, this._openCaseByClick, regexp);
        var caseInfo = this.pMakerAPI._getCaseInfoOperation(caseId, ErrCallback);
        if(caseInfo.status_code == 0){ //Controllo che il case esista
            var urlUnassignedList = this.pMakerAPI._getServerHostPm("OpenAssigned", "APP_UID=" + caseId + "&DEL_INDEX=" + index + "&sid=" + this.pMakerAPI.sessionId); 
            this._openPmTab(urlUnassignedList); 
            this.setCaseInfoMetada(caseId);
        }else{
            this.displayErrorMessage("status_code " + caseInfo.status_code + ": " + caseInfo.message);
        }
    }
};

/** 
 *	Check if there are new case not yet allocated available to the user.
 *	This check is done on the creation date of the cases than of the last inspection carried out.
 *	
 *	@return TRUE if it were found new case not assigned, FALSE otherwise  
 */
processMaker.prototype._isNewUnassignedCase = function() {
	this.pMakerAPI._checkNewUnassignedcase(this._casesResult['cases']);
};

/** Method that manage the notify message after we have set up the reminder
 *
 *	@param {boolean} showPM : if FALSE recover the mini calendar, otherwise check if there are new case not assigned setting the scheduler
 *	@param {Integer} attempts : number of attempts if there are not cases found
 */
processMaker.prototype._casesOnMiniCal = function(showPM, attempts){
    var minicalDIV = document.getElementById("skin_container_tree_footer");
    if(!minicalDIV) return;
    var newDiv = document.getElementById("pmUnassCaseDiv");
    if (showPM)	{ 	
        this._isSnoozed = false;
        var casesFound = this.pMakerAPI._getUnassignedCase();
        //The procedure "unassignedCaseList" return NULL when the session is expired, when we have some server side problem or unassigned case not found
        //If we have case not found, we want to be sure it not dipend from other case...
        //For this, the login is performed
        var postCallback = new AjxCallback(this, this._ShowCasesOnMiniCal, [minicalDIV, newDiv]);
        if(!casesFound){
            if(attempts < 2){
                var callback = new AjxCallback(this, this._casesOnMiniCal, [true, ++attempts, postCallback]);
                this.pMakerAPI._login(callback);
            }else{
                this._scheduleAction(this.checkUnassignedCases, this._checkDefaultDelay);
            }
        }else{
            postCallback.run();
        }
        this.setUserProperty("dateSnooze", "no", true);
    }else{
        if(newDiv && newDiv !== undefined){
            newDiv.innerHTML = "";
            if(this._miniCalStyle){
                minicalDIV.style.overflow = this._miniCalStyle;
            }
            if(this._miniCal){    	
                this._miniCal.style.visibility = "visible";
            }
        }
    }		
};

/** Redefines the content of the mini calendar
 * 
 *      @param {Element} minicalDIV : the div of mini calendar
 *	@param {Element} newDiv : thw new div to append at the mini calendar div
 */
processMaker.prototype._ShowCasesOnMiniCal = function(minicalDIV, newDiv){
    if (!newDiv) {
        newDiv = document.createElement("div");
        newDiv.id = "pmUnassCaseDiv";
        minicalDIV.appendChild(newDiv);
        this._miniCalStyle = minicalDIV.style.overflow;
        minicalDIV.style.overflow = "auto";
    }
    newDiv.style.margin = '0px';

    newDiv.innerHTML =
    [   "<table><tbody>",
        "<tr><td class='pmlogo'></td></tr>",
        "<tr><td style='color: blue' id='msgShow'><h4><blink id='blk'>" + this.getMessage("caseUnassigned") + "</blink></h4></td></tr>",
        "<tr><td><a href='javascript:void(0);' id='showUnassignedCaseLink'>" + this.getMessage("listView") + "</a></td>",
        "<td><a href='javascript:void(0);' id='ignoreUnassignedCaseLink'>" + this.getMessage("snooze") + "</a></td></tr>",
        "</tbody></table>" ].join("");

    this._addShowUnassignedCaseLinkHandler();	
    this._addIgnoreCaseLinkHandler();	
    if(ZmSetting.CALENDAR_ENABLED && appCtxt.get(ZmSetting.CAL_ALWAYS_SHOW_MINI_CAL) && !this._miniCal) {
        var calMgr = appCtxt.getCalManager();
        this._miniCal =  calMgr && calMgr._miniCalendar ? calMgr._miniCalendar.getHtmlElement() : null;
    }
    if(this._miniCal && this._isViewTabPM == false) {
        this._miniCal.style.visibility = "hidden";
    }	
};

/** Set the callback after the onclick event on the "list view" option
 */
processMaker.prototype._addShowUnassignedCaseLinkHandler = function(){
    document.getElementById("showUnassignedCaseLink").onclick = AjxCallback.simpleClosure(this._openUnassignedTab, this);
};

/**  Set the callback after the onclick event on the "Snooze" option 
 */
processMaker.prototype._addIgnoreCaseLinkHandler = function(){
    document.getElementById("ignoreUnassignedCaseLink").onclick = AjxCallback.simpleClosure(this._doSnooze, this, this.checkUnassignedCases);
};

/** Method to do a soap call at WS of PM of the procedure "unassignedCaseList"
 * 
 *	@param {boolean} alertPopupIsShowed : If it has been setted as TRUE, will be show a notify popup in the case of there are not case not assigned
 *	@param {AjxCallback} postCallback : callback performed only if there are case not assigned
 */
processMaker.prototype._getUnassignedCases = function(alertPopupIsShowed, postCallback) {
    var casesFound = this.pMakerAPI._getUnassignedCase();
    //The procedure "unassignedCaseList" return NULL when the session is expired, when we have some server side problem or unassigned case not found
    //If we have case not found, we want to be sure it not depends from other case...
    //For this, the login is performed
    if(!casesFound){
        var callback = new AjxCallback(this, this._verifyUnassignedCase, [alertPopupIsShowed, postCallback]);
        this.pMakerAPI._login(callback);
    }else{
        this._getUnassignedCasesCallback(alertPopupIsShowed, postCallback, casesFound);
    }
};

/** If the user has not made the login, will be show an error message, otherwise retry to do a "_getUnassignedCase"
 * 
 *	@param {boolean} alertPopupIsShowed : If TRUE will be show   a notify popup in the case of there are not case not assigned
 *	@param {AjxCallback} postCallback : callback performed only if there are case not assigned
 */
processMaker.prototype._verifyUnassignedCase = function(alertPopupIsShowed, postCallback) {
    if(!this.pMakerAPI.sessionId){	//server-side problems
        this.displayErrorMessage(this.getMessage("error_response_server"));
    }else{	// If we have had a session expired the procedure is performed again
        var casesFound = this.pMakerAPI._getUnassignedCase();
        this._getUnassignedCasesCallback(alertPopupIsShowed, postCallback, casesFound);
    }
};

/** Test the response of the "_getUnassignedCase"
 * 
 *	@param {boolean} alertPopupIsShowed : If it has been setted as TRUE, will be show a notify popup in the case of there are not case not assigned
 *	@param {AjxCallback} callback : callback performed only if there are case not assigned
 *	@param {Object} casesFound : the result of the "_getUnassignedCase"
 */
processMaker.prototype._getUnassignedCasesCallback = function(alertPopupIsShowed, callback, casesFound){
    if(casesFound == true){    // It has been found at least aunassigned case
        if(callback){
            callback.run();
        }
    }else{  // no one unassignedCase found
        if(alertPopupIsShowed) { 
            var msg = this.getMessage("useNoCase"); //The user not has unassigned case
            var dlg = appCtxt.getMsgDialog();
            dlg.registerCallback(DwtDialog.OK_BUTTON, this._okBtnListener, this, dlg);
            dlg.setMessage(msg, DwtMessageDialog.WARNING_STYLE);
            dlg.popup();
        }
        //Restoration of the mini calendar
        this._casesOnMiniCal(false);
    }
};

/**	Initializer the schedulers
 */
processMaker.prototype._initSchedulers = function() {
    this._checkDefaultDelay = 300000;
    this._firstCheckDelay = 5000;
    this._initSchedulerToUnassignedCases(); //Scheduler relative of at the viewing of unassigned case on the mini calendar
    this._initSchedulerToNewUnassignedCases(); //Scheduler relative of at the viewing of NEW unassigned case on the mini calendar than last check
};

/** Initializer the scheduling to check unassigned cases
 */
processMaker.prototype._initSchedulerToNewUnassignedCases = function() {
    this.checkNewUnassignedCases = new AjxTimedAction(this, this._checkNewUnassignedCases, 1);
    var lastCheck = (this.pMakerAPI.lastCheckNewCases == "predefined") ? null : this.pMakerAPI.lastCheckNewCases; 	// Date in milliseconds when we have the next check
    var diffTime = (lastCheck) ? ((new Date(parseInt(lastCheck)).getTime() + this._checkDefaultDelay) - new Date().getTime()) : null; // Time spent in milliseconds from last check
    if(diffTime && diffTime > 0){
        this._scheduleAction(this.checkNewUnassignedCases, diffTime); // I do the next check between a quantum of time equal to the time remaining from the last check
    }else{	
        this._scheduleAction(this.checkNewUnassignedCases, this._firstCheckDelay); // I do the first check after 5 seconds. Then, it has done about the "_checkDefaultDelay" that is a global variable
    }
};

/** Check if there are new unassigned cases
 * 
 *	@param {Integer} attempts : number of attempts if there are not cases found
 */
processMaker.prototype._checkNewUnassignedCases = function(attempts) {
    var casesFound = this.pMakerAPI._getUnassignedCase();
    //The procedure "unassignedCaseList" return NULL when the session is expired, when we have some server side problem or unassigned case not found
    //If we have case not found, we want to be sure it not depends from other case...
    //For this, the login is performed
    if(!casesFound){
        if(attempts < 2){
            var callback = new AjxCallback(this, this._checkNewUnassignedCases, ++attempts);
            this.pMakerAPI._login(callback);
        }else{
            this.setUserProperty("lastCheckNewCases", new Date().getTime(), true);
        }
        this._scheduleAction(this.checkNewUnassignedCases, this._checkDefaultDelay);
    }else{
        this._isNewUnassignedCase();
    }
};

/** if there are new unassigned cases I notify the user
 * 
 *	@param {Boolean} isNewUnassignedCase : true if there are new unassigned cases, no otherwise. 
 */
processMaker.prototype._checkNewUnassignedCasesCallback = function(isNewUnassignedCase) {
    if(isNewUnassignedCase == true){
        this._showNotifyUnassignedCases();
    }
    this.setUserProperty("lastCheckNewCases", new Date().getTime(), true);
    this._scheduleAction(this.checkNewUnassignedCases, this._checkDefaultDelay);
};

/** Initialize the scheduling to check the unassigned cases
 */
processMaker.prototype._initSchedulerToUnassignedCases = function() {
    var dateEndSnooze = (this.pMakerAPI.dateSnooze == "no") ? null : this.pMakerAPI.dateSnooze; // Date in milliseconds when we did the last snooze     
    var diffTime = (dateEndSnooze) ? (new Date(parseInt(dateEndSnooze)).getTime() - new Date().getTime()) : null; // Time spent in milliseconds from now to I did the last "snooze from mini calendar".
    if(diffTime && diffTime > 0){
        this._isSnoozed = true;
        this.checkUnassignedCases = new AjxTimedAction(this, this._casesOnMiniCal, [true, 1]);
        this._scheduleAction(this.checkUnassignedCases, diffTime);  // I did the first check after time remaining in base at the last snooze
    }else{	
        if(diffTime && diffTime <= 0){
            this.setUserProperty("dateSnooze", "no", true); // Update the properties relative of the last snooze
        }
        this._isSnoozed = false;
        this.checkUnassignedCases = new AjxTimedAction(this, this._casesOnMiniCal, [true, 1]);
        this._scheduleAction(this.checkUnassignedCases, this._firstCheckDelay );  // I did the first check after 5 seconds.
    }
};

/** Method that manage the notify popup to user for the unassigned cases
 */
processMaker.prototype._showNotifyUnassignedCases = function() {
    var dlg = appCtxt.getYesNoMsgDialog();	
    dlg.registerCallback(DwtDialog.YES_BUTTON, this._showUnassignedCases, this, dlg);
    dlg.registerCallback(DwtDialog.NO_BUTTON, this._NoButtonClicked, this, dlg);
    var message = this.getMessage("messageAlert");
    var style = DwtMessageDialog.WARNING_STYLE; //show info status by default
    dlg.setMessage(message, style);
    dlg.popup();
};

/** Close the popup
 * 
 *	@param {DwtDialog} dlg : the dialog
 */
processMaker.prototype._NoButtonClicked = function(dlg) {
    dlg.popdown();
};

/** Open the tab in the section of the unassigned cases
 *
 *	@param {DwtDialog} dlg : the dialog
 */
processMaker.prototype._showUnassignedCases = function(dlg) {
    if(dlg){
        dlg.popdown();
    }
    var urlUnassignedList = this.pMakerAPI._getServerHostPm("casesSelfService", "sid=" + this.pMakerAPI.sessionId); 
    this._openPmTab(urlUnassignedList);   
};

/** Check, if it is exist, the validity of the caseId in the metadata. If it is not, continue with the procedure to create a new case,
 *  otherwise will be give the possibility to the user of recover this case or of create a new case.
 *	
 *	@param {String} processId : Id of selected process from the list of available process for the user 
 */
processMaker.prototype._checkMetaDataBeforeNewCase = function(processId) {
    if(this._caseIdMetaData){ // To do the check of caseId that there is in the metadata of the email
        caseInfo = this.pMakerAPI._getCaseInfoOperation(this._caseIdMetaData, null);
        if(caseInfo && caseInfo.status_code == 100){ //In the event that there is caseID in the metadata but one that belongs to another user who has used the same e-mail from the same account Zimbra
            this.pMakerAPI._newCase(processId);
        }else{
            this._ShowRecuperateDialog(processId);
        }
    }else{
        this.pMakerAPI._newCase(processId);
    }
};

/** Processes the response of the "newCase" procedure. If the response is valid, we can continue with the creation of case
 *  otherwise will be make again the login and retry one more the procedure 
 *   
 *	@param {String} processId : Id of selected process from the list of available process for the user 
 *	@param {Object} response : the newcase response
 */
processMaker.prototype._newCaseCallback = function(processId, response) {
    if(this._isValidResponse(response.success, 'newCase') == false) { return; }
    var xmlResponse = new AjxXmlDoc.createFromDom(response.xml);
    var jsonObj = xmlResponse.toJSObject(true, false);
    jsonObj = jsonObj.Body.newCaseResponse;
    var statusCode = jsonObj.status_code.toString();
    if(statusCode == 0){ //Command executed successfully	
        var caseId = jsonObj.caseId.toString();
        this._manageNewCase(processId, caseId);
    }else{	
        if(statusCode == 9 || statusCode == 24){ //Session expired
            var callback = (!this._doubleClickedFlag) ? new AjxCallback(this, this._checkMetaDataBeforeNewCase, processId) : new AjxCallback(this.pMakerAPI, this.pMakerAPI._newCase, processId);
            if(!this._doubleClickedFlag) {
                var callback = new AjxCallback(this, this._checkMetaDataBeforeNewCase, processId);
            }else{
                var callback = new AjxCallback(this.pMakerAPI, this.pMakerAPI._newCase, processId);
            }
            this.pMakerAPI._login(callback);
        }else{
            var message = jsonObj.message.toString();
            this.displayErrorMessage(message);
        }
    }
};

/** It show a popup to choose at the user, if to recover the case opened before from the same user or create a new case
 * 
 *	@param {String} processId : Id of selected process from the list of available process for the user 
 */
processMaker.prototype._ShowRecuperateDialog = function(processId) {	
    var recupComp = new DwtComposite({parent:this.getShell()});
    recupComp.getHtmlElement().innerHTML = this._setRecupView();
    //Create the form
    var recupId = Dwt.getNextId();
    var recupButt = new DwtDialog_ButtonDescriptor(recupId, this.getMessage("recoversActivity"), DwtDialog.ALIGN_RIGHT);
    var newCaseId = Dwt.getNextId();
    var newCaseButt = new DwtDialog_ButtonDescriptor(newCaseId, this.getMessage("NewCase"), DwtDialog.ALIGN_RIGHT);

    var recDialog = new ZmDialog({	
        view:recupComp, 
        parent:this.getShell(), 
        standardButtons:[DwtDialog.CANCEL_BUTTON],
        extraButtons:[recupButt, newCaseButt]
    });
    recDialog.popup();

    //Define listeners
    recDialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, function() { recDialog.popdown(); recDialog.dispose(); }));

    var buttonRecupListener = new AjxListener(this, function() { recDialog.popdown(); recDialog.dispose(); this._doRecuperateCase(); });
    recDialog.setButtonListener(recupId, buttonRecupListener);

    var buttonNewCaseListener = new AjxListener(this, function() { recDialog.popdown(); recDialog.dispose(); this.pMakerAPI._newCase(processId); });
    recDialog.setButtonListener(newCaseId, buttonNewCaseListener);
};

/** Create the html code
 * 
 *	@return {String} : the html code to assign to dialog to choose if the user want recover the case      
 */
processMaker.prototype._setRecupView = function() {	
    var html = new Array();
    html.push("<table>", "<tr><td>" + this.getMessage("emailUsed") + "</td></tr>", "</table>");
    return html.join('');
};

/** open the case created before viewing in the PM tab
 */
processMaker.prototype._doRecuperateCase = function() {	
    var url = this.pMakerAPI._getServerHostPm("OpenAssigned", "APP_UID=" + this._caseIdMetaData + "&DEL_INDEX=1&sid=" + this.pMakerAPI.sessionId); 
    this._openPmTab(url);
};

/** Transfer, if it are present, attachments from email in PM, open the tab to compile for the tab of the new case, save the caseId in the metadata of the email, 
 *   and apply the tag to the email if this was not just has been applied before.
 *                                       
 *	@param {String} processId : Id of selected process from the list of available process for the user 
 *	@param {String} caseId : Id of the case created from the "new_case" procedure
 */
processMaker.prototype._manageNewCase = function(processId, caseId) {	
    if(!this._doubleClickedFlag){
		this.pMakerAPI._sendVariables(caseId, this.currentMsg);
        this._uploadInputDocumentToPM(processId, caseId);
    }
    var urlOpenCase = this.pMakerAPI._getServerHostPm("cases_Open", "APP_UID=" + caseId + "&DEL_INDEX=1&sid=" + this.pMakerAPI.sessionId);
    this._openPmTab(urlOpenCase);

    if(!this._doubleClickedFlag){
        this.setCaseInfoMetada(caseId); // Save the caseId in the metadata in the email used
    }
    var tag = this.getUserProperty("tag"); // If the option is enable apply the tag to the email.
    if(tag == 'yes' && !this._doubleClickedFlag) {	
        this._addTag(true, this.currentMsg.id, this._tagId);
    }
    this._doubleClickedFlag = false;
};

/** Open the tab of PM of the cases with status, if it exists.
 * 
 *	@param {String} statusCase : Status of the case of interest
 *	@param {ObjectXMl} response : The response of the procedure "caseList"
 */
processMaker.prototype._caseListCallback = function(statusCase, response) {  
    if(this._isValidResponse(response.success, 'caseList') == false) { return; }
    var xmlResponse = new AjxXmlDoc.createFromDom(response.xml);
    var jsonObj = xmlResponse.toJSObject(true, false);
    jsonObj = jsonObj.Body.caseListResponse.cases;
    if(jsonObj && typeof(jsonObj[0]) == 'undefined'){
        this._casesResult = [];
        this._casesResult.push(jsonObj);		
        jsonObj	= this._casesResult;
    }
    if(jsonObj.length > 0){
        for(var i = 0; i < jsonObj.length; i++){
            if(jsonObj[i].item[2].value == statusCase){
                switch(statusCase){
                    case 'TO_DO' : {	
                        var urlTab = this.pMakerAPI._getServerHostPm("casesInbox", "sid=" + this.pMakerAPI.sessionId); 
                        this._openPmTab(urlTab); 
                        return;
                    }
                    case 'DRAFT' : {	
                        var urlTab = this.pMakerAPI._getServerHostPm("casesDraft", "sid=" + this.pMakerAPI.sessionId); 
                        this._openPmTab(urlTab); 
                        return;
                    }	
                } 
            }
        }
    }
    if(this._flagRepeat < 1){
        this._flagRepeat++;
        var postCallback = new AjxCallback(this, this._caseListCallback, statusCase);
        var callback = new AjxCallback(this.pMakerAPI, this.pMakerAPI._caseList, postCallback);
        this.pMakerAPI._login(callback);
        return;
    }	
    var nocaseMsg = "";
    switch(statusCase){
        case 'TO_DO' : 	{ nocaseMsg = this.getMessage("noCaseInbox"); break; }
        case 'DRAFT' :	{ nocaseMsg = this.getMessage("noCaseDraft"); break; }
    }
    this._showMessage(nocaseMsg, DwtMessageDialog.INFO_STYLE); 
};

/** Open the tab of PM of the unassigned case, if it exists.
 */
processMaker.prototype._openUnassignedTab = function() {  	
    if(this.pMakerAPI.sessionId){
        //Reset the viewing of the mini calendar
        var callback = new AjxCallback(this, this._showUnassignedCases, null);
        this._getUnassignedCases(true, callback);	//to manage the popup when there is no case unassigned
    }else{
        this.displayStatusMessage(this.getMessage("userNotLogged"));
        this.createPropertyEditor(new AjxCallback(this, this._showYesNoReloadDialog));
    }
};

/** Create the dialog to place after the next check of unassigned case
 */
processMaker.prototype._openReminderDialog = function() {
    if (this._reminderDialog) { 
        this._reminderDialog.popup();
        return;
    }
    var view = new DwtComposite(this.getShell()); 
    view.getHtmlElement().innerHTML = this._createHtmlReminder(); 

    //create the inputBox for the hour
    var snoozeH = new DwtInputField({parent: view, type:DwtInputField.INTEGER, hint:this.getMessage("hintSnoozeHour")});
    snoozeH.reparentHtmlElement("timeSnoozeHour");
    //create the inputBox for the minutes
    var snoozeM = new DwtInputField({parent: view, type:DwtInputField.INTEGER, hint:this.getMessage("hintSnoozeMinutes")});
    snoozeM.reparentHtmlElement("timeSnoozeMinute");
    var snoozeMillis = this.pMakerAPI.snooze;
    if(snoozeMillis !== 0){ // Write in the field hour and minutes the value setted previously
        var secTot = snoozeMillis / 1000;
        var minutes = secTot / 3600;
        var hours = (secTot / 60) - (parseInt(minutes) * 60);
        snoozeM.setValue(hours);
        snoozeH.setValue(parseInt(minutes));
    }

    this._reminderDialog = new ZmDialog({title:this.getMessage("reminderTitle"), view:view, parent:this.getShell(), standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]});
    this._reminderDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._reminderDialogOkBtnListener, [snoozeH, snoozeM])); 
    this._reminderDialog.popup();
};

/** OK listenet for chenge the snooze time for the next check of unassigned case
 * 
 * 	@param {DwtInputField} snoozeH : The field that rapresents the hours
 *	@param {DwtInputField} snoozeM : The field that rapresents the minutes
 */
processMaker.prototype._reminderDialogOkBtnListener = function(snoozeH, snoozeM) {
    var hour = snoozeH.getValue();
    hour = (hour == "") ? 0 : hour;
    var minutes = snoozeM.getValue();
    minutes = (minutes == "") ? 0 : minutes;
    var newSnoozeMillis = ((hour * 3600) + (minutes * 60)) * 1000;
    //If there is an ongoing snooze previously set, update it with the new parameters.
    if(this._isSnoozed == true){
        newSnoozeMillis = (newSnoozeMillis == 0) ? this._checkDefaultDelay : newSnoozeMillis;
        dateNextCheck = new Date(new Date().getTime() + parseInt(newSnoozeMillis)).getTime();
        var diffTime = (dateNextCheck) ? (new Date(parseInt(dateNextCheck)).getTime() - new Date().getTime()) : null;
        this.setUserProperty("dateSnooze", dateNextCheck, true);
    }
    this.setUserProperty("snooze", newSnoozeMillis, true, new AjxCallback(this, this._showYesNoReloadDialog));
    this._reminderDialog.popdown();
};

/** Create the html code for the ReminderDialog
 * 
 *	@return {String} the html code 
 */
processMaker.prototype._createHtmlReminder = function() {
    var html = new Array();
    html.push("<table width='100%'>", "<tr><td align=center id='timeSnoozeHour'>" + this.getMessage("hours") + 
        " </td><td align=center id='timeSnoozeMinute'>" + this.getMessage("minutes") + " </td></tr><tr></tr>", "</table>");
    return html.join("");
};

/** Update the time for the next check for the next check of unassigned case
 * 
 * 	@param {AjxTimedAction} scheduler : The scheduler
 */
processMaker.prototype._doSnooze = function(scheduler) {
    this._isSnoozed = true;
    this._casesOnMiniCal(false);
    var snooze = (this.pMakerAPI.snooze == "predefined") ? null : this.pMakerAPI.snooze; // Interval of time in milliseconds by the scheduler to perform the checks
    var dateNextCheck = null;
    var dateNextCheckScheduler = null;
    if(snooze){
        dateNextCheck = new Date(new Date().getTime() + parseInt(snooze)).getTime();
        dateNextCheckScheduler = this.pMakerAPI.snooze;
    }else{
        dateNextCheck = new Date(new Date().getTime() + this._checkDefaultDelay).getTime();
        dateNextCheckScheduler = this._checkDefaultDelay;
    }
    this.setUserProperty("dateSnooze", dateNextCheck, true);
    this._scheduleAction(scheduler, dateNextCheckScheduler);
};

/** Schedule the action  
 * 
 *   	@param {AjxTimedAction} scheduler : The scheduler
 * 	@param {Integer} valSnooze : the snooze time
 */
processMaker.prototype._scheduleAction = function(scheduler, valSnooze) {	 
    AjxTimedAction.scheduleAction(scheduler, valSnooze);
};

/** Open the report view in the PM tab. It is necessary to have ProcessMaker Enterprice and to have the pmReports plugin enabled
 */
processMaker.prototype._openReports = function() {	 
    var users = this.getConfig("ValidUserToReports").split(",");
    if(inArray(users, "*") !== -1 || inArray(users, this.pMakerAPI.user) !== -1){
        var protocol = (this.pMakerAPI.protocol !== null) ? this.pMakerAPI.protocol : "http";
        var workspace = (this.pMakerAPI.workspace!==null) ? this.pMakerAPI.workspace : "workflow";
        var url = protocol + "://" + this.pMakerAPI.server + "/sys" + workspace + "/en/plugins/pmReports/report?action=consolidated";
        if(this._browser == 'CH'){
            this._openPmTab(url); // Funziona solo su Chrome
        }else{
            this._openPmLink(url);
        }
    }else{
        var msg = this.getMessage("userNotPermitted");//"Utente non autorizzato";
        var dlg = appCtxt.getMsgDialog();
        dlg.registerCallback(DwtDialog.OK_BUTTON, this._okBtnListener, this, dlg);
        dlg.setMessage(msg, DwtMessageDialog.WARNING_STYLE);
        dlg.popup();
    }
};

/** if the browser is not Google Chrome : Open the tab in an other windows of the browser
 * 
 *	@param {String} url : Url of content that will be inside the tab
 */
processMaker.prototype._openPmLink = function(url) {
    window.open(url);
};

/**
 * 
 *	@param {DwtDialog} dlg : the dialog
 */
processMaker.prototype._okBtnListener = function(dlg) {
    dlg.popdown(); // close the dialog
};

/** Get the list process
 */
processMaker.prototype._getProcessList = function() {
    // The sessionId is NULL only when we have failed the login during the Init
    // In this case, user can to compile the our credential. Then, It runs a new Login and in positive case it runs the operation
    if(!this.pMakerAPI.sessionId){	
        this.displayStatusMessage(this.getMessage("userNotLogged"));
        this.createPropertyEditor(new AjxCallback(this, this._showYesNoReloadDialog));
    }else{	
        this.pMakerAPI._processList();
    }
};

/** Show the process list to do select at user
 * 
 *	@param {Object} response : the response of the processList
 */
processMaker.prototype._selectProcessView = function(response) {
    var xmlResponse = new AjxXmlDoc.createFromDom(response.xml);
    var items = xmlResponse.getElementsByTagName('item');
    var allProcesses = [];
    allProcesses.push({ label : this.getMessage("processAvailable"),  value: "0" });
    for (var i = 0; i < items.length; i++){
        if(this._getNodeValue(items[i], 'key') == "guid"){
            processGuid = this._getNodeValue(items[i], 'value');
        }
        if(this._getNodeValue(items[i],'key') == "name"){
            processName = this._getNodeValue(items[i], 'value');
            allProcesses.push({ label : processName,  value: processGuid });
        }
    }
    if(items.length > 0){//There are Process
        var view = new DwtComposite(this.getShell());
        view.getHtmlElement().innerHTML = this._setProcessView();

        var selProcess = new DwtSelect({parent:view});
        selProcess.reparentHtmlElement("selectProcess");
        this._fillFormSelect(selProcess, allProcesses);

        var dlg = new ZmDialog({ 	
            title:this.getMessage("selectProcTostart"), 
            view:view, parent:this.getShell(), 
            standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON] 
        });

        dlg.popup();

        //OK_BUTTON Listener
        dlg.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() { this._selectProcessViewOkListener(dlg, selProcess); }));

        //CANCEL_BUTTON Listener
        dlg.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, function() { dlg.popdown(); dlg.dispose(); }));

    }else{//there aren't
        this.displayErrorMessage(this.getMessage("notAbleStartCase"));	//"You cannot initiate a new case.";
    }
};

/** Get the value of the node with a tag name
 * 
 *	@param {Element} obj : the element
 *	@param {String} tag : the tag name
 */
processMaker.prototype._getNodeValue = function(obj, tag) {
	return obj.getElementsByTagName(tag)[0].firstChild.nodeValue;
};

/** popolation of the DwtSelect
 * 
 *	@param {DwtSelect} selProcess : the Object for the selection of the process
 *	@param {Array} processes : process list that user can execute
 */
processMaker.prototype._fillFormSelect = function(selProcess, processes) {
    for (var i = 0; i < processes.length; i++){ 
            selProcess.addOption(processes[i]['label'], false, processes[i]['value'], false);
    }
};

/** Create the html code for dialog to select the process
 * 
 *	@return {String} The html code
 */
processMaker.prototype._setProcessView = function() {	
    var html = new Array();
    html.push("<table>", "<tr><td id=selectProcess></td></tr>", "</table>");
    return html.join('');
};

/** Initialize a new case, saving the attachments in tmp/
 * 
 *	@param {ZmDialog} dlg : the dialog
 *	@param {DwtPropertyEditor} selProcess : EditorProcessList
 */
processMaker.prototype._selectProcessViewOkListener = function(dlg, selProcess) {
    var processId = selProcess.getValue();
    if(processId !== 0){
        dlg.popdown();
        dlg.dispose();
        this.displayStatusMessage(this.getMessage("initNewCase"));
        if(!this._doubleClickedFlag){
            var callback = new AjxCallback(this, this._checkMetaDataBeforeNewCase, processId);
            this.manageSaveFileAttached(callback);
        }else{
            this.pMakerAPI._newCase(processId);
        }
    }else{
        this.displayErrorMessage(this.getMessage("selectProcTostart"));
    }
};

/** Saved the content of an email
 *
 *	@param {ZmmailMsg} srcMsgObj : the email
 *	
 *	@return	{String} The body of email
 */
processMaker.prototype._getMailBodyAsText = function (srcMsgObj) {
    var body = "";
    var bodyTemp = "";

    if (srcMsgObj.body) {
            body = AjxStringUtil.htmlEncode(srcMsgObj.body);
    } else if (srcMsgObj._topPart && srcMsgObj._topPart.getContentForType) {
            body = AjxStringUtil.htmlEncode(srcMsgObj._topPart.getContentForType(ZmMimeTable.TEXT_PLAIN));
    } else {
            body = "";
    }

    if (!body || body == "") {
        if (!srcMsgObj.isHtmlMail()) {
                return srcMsgObj.getBodyContent();
        }
        var div = document.createElement("div");
        div.innerHTML = srcMsgObj.getBodyContent();
        return AjxStringUtil.convertHtml2Text(div);
    } else {
        return  body;
    }	
};

/** Method that recover the subject from message   
 * 
 * 	@param {ZmmailMsg} msg : the email
 */
processMaker.prototype._getSubjectEmail = function(msg) {
    return msg.subject;
};

/** Method that recover the data sent from message  
 * 
 *  	@param {ZmmailMsg} msg : the email 
 */
processMaker.prototype._getSentDateEmail = function(msg) {
    return msg.sentDate;
};

/** Specify if the email has been sent or received
 * 
 *   	@param {ZmmailMsg} msg : the email
 */
processMaker.prototype._isSentEmail = function(msg) {
    return msg.isSent;
};

/** Method that recover a data field from message   
 * 
 * 	@param {ZmmailMsg} msg : the email
 * 	@param {ZmmailMsg} typeField : type of the email field to retrieve
 */
processMaker.prototype._getMsgData = function(msg, typeField) {
    var datas = new Array();
    var nameTo = new Array();
    var addressTo = new Array();
    var typeAddresses = msg.getAddresses(typeField);	
    if (typeAddresses) {
        var typeArray = typeAddresses.getArray();
        for (var i = 0; i < typeArray.length; i++) {
            var addr = typeArray[i];
            var address = addr.getAddress(); // {String}
            var name = addr.getName(); // {String}
            nameTo.push(name);
            addressTo.push(address);		
        }
        return {"nameTo": nameTo, "addressTo": addressTo};
    } else {
        return "";
    }
};

/** Runs a check to the result form response 
 *
 *	@param {boolean} flagSuccess : result of the request ( true/false )
 *	@param {String} nameFunction : function name that check the response 
 *	
 *	@return	{boolean} l'esito
 */
processMaker.prototype._isValidResponse = function(flagSuccess, nameFunction) {
    if(flagSuccess == false){
        this.displayErrorMessage(nameFunction + this.getMessage("error_response_server"));
    }	
    return flagSuccess;
};

/** Show a message   
 * 
 * 	@param {ZmmailMsg} expnMsg : the body of the message
 * 	@param {ZmmailMsg} style : the style of the message
 */
processMaker.prototype._showMessage = function(expnMsg, style) {
    var msg = "";
    if (expnMsg instanceof AjxException) {
        msg = expnMsg.msg;
    } else {
        msg = expnMsg;
    }
    var dlg = new DwtMessageDialog({parent:this.getShell(), buttons:[DwtDialog.OK_BUTTON]});
    dlg.reset();
    dlg.setMessage(msg, DwtMessageDialog.INFO_STYLE);
    dlg.popup();
};

//************************************************************************************************
//********************************** Manager Start attachments ***********************************
//************************************************************************************************

/** Method that allows you to upload attachments on the mail server zimbra
 * 
 * 	@param {String} processId : the process ID
 * 	@param {String} caseID : the case ID
 */
processMaker.prototype._uploadInputDocumentToPM = function(processId, caseID) {
    var docUID = this.pMakerAPI._inputDocumentProcessList(processId, "Attached");
    var attachedFiles = new Array();
    var attachments = this.currentMsg.attachments;
    if(attachments){
        if(attachments.length > 0){
            for (var i = 0; i < attachments.length; i++){
                attachedFiles[i] = attachments[i].filename;
            }
        }else if(attachments[0] !== 'undefined' && attachments[0]){
            attachedFiles[0] = attachments[0].filename;
        }
    }
    for(var i = 0; i < attachedFiles.length; i++){
        this._runUploadFile(docUID, caseID, attachedFiles[i]);
    }
};

/** Method that invoke the jsp file to upload the file in processmaker
 *
 * 	@param {String} docUID : the document UID
 * 	@param {String} caseId : the case ID
 * 	@param {String} filename : the document filename
 */
processMaker.prototype._runUploadFile = function (docUID, caseId, filename) {
    var index = 1; //default value
    var adminId = '00000000000000000000000000000001'; // This would want used as parameter for passing at the method that allows the upload in the PM server
    var reqParam = 'caseID=' + caseId + '&nameFile=' + filename + '&userID=' + adminId + '&docID=' + docUID + '&index=' + index + 
        '&server=' + this.pMakerAPI.server + '&workspace=' + this.pMakerAPI.workspace + '&port=' + this.pMakerAPI.port + '&protocol=' + this.pMakerAPI.protocol;
    var serverURL = this.getResource("JSP/uploadPmInputDoc.jsp");
    AjxRpc.invoke(null, serverURL + '?' + reqParam, null, null, true);
};

/** Method to save the file in the /tmp/ folder of zimbra through the save.jsp file
 * 
 *      @param {AjxCallback} postCallback : the callback
 */
processMaker.prototype.manageSaveFileAttached = function(postCallback) {
    var params = [];
    var i = 0;
    params[i++] = "id=" + this.currentMsg.id;
    params[i++] = "type=" + this.currentMsg.toString();
    var paramUrl = params.join("&");
    var url = this.getResource("JSP/save.jsp");
    var callback = new AjxCallback(this, this.manageSaveFileAttachedCallback, postCallback);
    AjxRpc.invoke(null, url + "?" + paramUrl, null, callback, true);
};

processMaker.prototype.manageSaveFileAttachedCallback  = function(postCallback, response) {
    if (response.success == true) {
        postCallback.run();
    }
};

//************************************************************************************************
//************************************ Manager End attachments ***********************************
//************************************************************************************************


//************************************************************************************************
//************************************ Manager start PM Tab **************************************
//************************************************************************************************

/** initialize the content Tab
 *
 */
processMaker.prototype._initPmTab = function(){
    //Create the TAB of ProcessMaker
    this._isViewTabPM = false; // Suggest if we are in the view PM tab or no
    var app = appCtxt.getApp(this._PmTab);
    if(app){  //initialize the content Tab
        var url = this.pMakerAPI._getServerHostPm("casesInbox", "&sid=" + this.pMakerAPI.sessionId);
        app.setContent("<iframe name=\"tabiframe-app\" src=\"" + url + "\" width=\"100%\" height=\"100%\" /></iframe>"); // write HTML to app
    }
    this._isInitTabMenu = true;
};

/** Open the PM tab to the specific url
 *	@param {String} tabUrl : url to call
 */
processMaker.prototype._openPmTab = function(tabUrl) {	
    if(this._browser == 'IE'){
        this._openPmLink(tabUrl);
    }else{
        var app = appCtxt.getApp(this._PmTab);
        app.setContent("<iframe name=\"tabiframe-app\" src=\"" + tabUrl + "\" width=\"100%\" height=\"100%\" /></iframe>");	
        this._directClickOnTab = false;
        app.launch();
    }
};

/** Open the PM link to the specific url in a new tab
 * 
 *	@param {String} pmUrl : url to call
 */
processMaker.prototype._openPmLink = function(pmUrl) {
    window.open(pmUrl);
};

/** Build the option for the overview tab
 * 
 *	@param {String} id : the id
 *	@param {String} name : the name
 *	@param {String} target : the target
 *	@param {String} icon : the icon
 *	
 *	@return {Object} : the option       
 */
processMaker.prototype._setFolderTabOverview = function(id, name, target, icon) {
    var folderObj = { 
        id : id, 
        name : name, 
        target : target, 
        icon : icon 
    };
    return folderObj;
};

/** Make the PM menu then content of zimlet panel (for the PM tab view)
*/
processMaker.prototype.buildOverview = function(){
    var folderGroups = [];
    var activeApp = appCtxt.getCurrentApp();
    var overview = activeApp ? activeApp.getOverview() : null;
    var overviewEl = overview.getHtmlElement();

    folderGroups = [
        {
            name: "ProcessMaker",
            id: "",
            handler: this._openWebspace,
            folders: [
                this._setFolderTabOverview("PROCESSLIST", this.getMessage("NewCase"), "startCase", "ImgADD-panelIcon"),
                this._setFolderTabOverview("CASELIST", this.getMessage("CasesInbox"), "casesList", "ImgFDP-panelIcon"),
                this._setFolderTabOverview("DRAFT", this.getMessage("Draft"), "casesDraft", "ImgDFT-panelIcon"),
                this._setFolderTabOverview("PARTICIPATED", this.getMessage("Participated"), "casesSent", "ImgPRT-panelIcon"),
                this._setFolderTabOverview("UNASSIGNED", this.getMessage("Unassigned"), "casesSelfService", "ImgUAS-panelIcon"),
                this._setFolderTabOverview("PAUSED", this.getMessage("Paused"), "casesPaused", "ImgPSD-panelIcon"),
                this._setFolderTabOverview("RELOGIN", this.getMessage("redoLogin"), "reLogin", "ImgReLogin"),
                this._setFolderTabOverview("ABOUT_SEACOM", this.getMessage("about"), "about", "Imgseacom-panelIcon")
            ]
        }
    ];
	
    overviewEl.innerHTML = '';
    var group;
    for (group in folderGroups) {
        var buildoverviewHtml = [];
        var i = buildoverviewHtml.length;
        var thisGroup = folderGroups[group];
        buildoverviewHtml[i++] = this._buildFolderGroupHtml(thisGroup);
        var folderGroupNode = document.createElement('div'), id = thisGroup.id,	className = 'DwtComposite overviewFolderGroup',	stylet = 'display: block;';
        folderGroupNode.setAttribute('id', id);
        folderGroupNode.setAttribute('class', className);
        folderGroupNode.setAttribute('style', stylet);
        folderGroupNode.innerHTML = buildoverviewHtml.join('');
        var folderGroupClickHandler = thisGroup.handler ? thisGroup.handler : null;
        folderGroupNode.onclick = AjxCallback.simpleClosure(this._overviewClickHandler, this, this, thisGroup);
        overviewEl.appendChild(folderGroupNode);		
    }
};


/** Creates the HTML for a folder group element in the tab zimlet overview tree view.
 *  Recursively calls this._renderFoldersHtml for each folder (and subfolder) contained in the group.
 * 
 *      @param {Object}	folderGroup : the individual folder group object
 *      
 *      @returns {String} HTML fragment
 */
processMaker.prototype._buildFolderGroupHtml = function(folderGroup){
    this.overviewHtml = [];
    var folder;
    this.__i = this.overviewHtml.length;

    //HEADER
    var headerId = "overview_expandIcon_" + Dwt.getNextId();
    var name = folderGroup.name;
    var subs = { headerId: headerId, name: name	};
    this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderGroup", subs);

    //FOLDERS/ITEMS
    for (folder in folderGroup.folders) {
        this._renderFoldersHtml(folderGroup.folders[folder]);
    }
    this.overviewHtml[this.__i++] = '</div>';
    return this.overviewHtml.join('');
};


/** Called recursively by this._buildFolderGroupHtml to generate HTML for individual folder items and subfolders.
 * 
 *      @param {Object}	folder : Folder object
 *      @param {Number} level : Indicates the level of indentation in subfolders. Only passed in by this function when it calls itself recursively.
 */
processMaker.prototype._renderFoldersHtml = function(folder, level) {
    var fn = folder.name;
    var collapsable = folder.hasOwnProperty('subfolders') ? true : false;
    var level = level ? level : 1;
    var id = folder.id ? folder.id : Dwt.getNextId();
    var sid = "overview_expandIcon_" + Dwt.getNextId();

    var sub1 = {id:id};
    var sub2 = {id:sid};
    var sub3 = {icon: folder.icon};
    var sub4 = {name: folder.name};

    this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderItemOpen", sub1);

    if (collapsable) { var restoreLevel = level; level -= 1; }

    for (var i = level - 1; i >= 0; i--){
        this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderItemLevel", {});
    };

    if (collapsable) {
        this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderItemCollapsable", sub2);
    }

    if (folder.icon) {
        this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderItemIcon", sub3 );
    }

    this.overviewHtml[this.__i++] = AjxTemplate.expand("com_processmaker_zimbra.template.overview#folderItemClose", sub4);

    if (folder.subfolders) {
        level = restoreLevel ? restoreLevel : level;
        level += 1; 
        this.overviewHtml[this.__i++] = '<div class="containerGroup">';
        for (var sf in folder.subfolders) {
            this._renderFoldersHtml(folder.subfolders[sf], level);
        }
        this.overviewHtml[this._i++]="</div>";
    }
};

/** Main click handler for overview items.
 *  If the user clicked on a collapse/expand handle, collapse or expand the folder group.
 *  If the user clicked something else AND a click handler was specified, run the handler, passing in the ID of the overview item.
 * 
 *      @param {Object} ev : Event object
 *      @param {Function} thisVal : this object
 *      @param {Function} thisGroup : the group of options
 */
processMaker.prototype._overviewClickHandler = function(thisVal, thisGroup, ev) {	
    if (AjxEnv.isIE) {
        ev = window.event;
    }
    var dwtev = DwtShell.mouseEvent;
    dwtev.setFromDhtmlEvent(ev);
    var el = dwtev.target;
    var origTarget = dwtev.target;
    var origHandler = thisGroup.handler;
    var origFolders = thisGroup.folders;

    if (origTarget.className == "ImgNodeExpanded" || origTarget.className == "ImgNodeCollapsed") {
        var toHide = "block";
        if (origTarget.className == "ImgNodeExpanded") {
            origTarget.className = "ImgNodeCollapsed";
            toHide = "none";
        } else {
            origTarget.className = "ImgNodeExpanded";
        }
    } else if (origTarget.className !== 'overviewHeader-Text') {
        var elId;
        while (el && el.className !== 'DwtTreeItem') {
            el = el.parentNode;
            elId = el.id;
        }

        var target = "";
        for(var i = 0; i < origFolders.length; i++){
            if(origFolders[i].id == elId){
                target = origFolders[i].target;
            }
        }
        origHandler(thisVal, target);
    }
};

/** Open the correct destination
 * 
 *      @param {Object} thisVal : this object
 *      @param {Object} target : the target
 */
processMaker.prototype._openWebspace = function(thisVal, target) {	
	if(target == 'about'){
		thisVal._createAboutPage("SiFlow", "1.0", "2014");
    }else if(target == 'reLogin'){
        var callback = new AjxCallback(thisVal, thisVal._openWebspace, [thisVal, "casesList"]);
        thisVal.pMakerAPI._login(callback);
    }else{
        var urlPmtab = thisVal.pMakerAPI._getServerHostPm(target, "&sid=" + thisVal.pMakerAPI.sessionId);
        thisVal._openPmTab(urlPmtab);
    }
};

//************************************************************************************************
//************************************** Manager end PM Tab **************************************
//************************************************************************************************


//************************************************************************************************
//********************************* Manager start PM Toolbar *************************************
//************************************************************************************************


processMaker.prototype._addDivPmBar = function(){
    if(this.prevSelection && this.prevSelection.type == "CONV"){
        var infoBar = document.getElementById(["zv__CLV-main__CV__header"].join(""));
    }else{
        var viewId = appCtxt.getCurrentViewId();
        if (viewId == "TV-main") {
            var infoBar = document.getElementById(["zv__TV__", viewId,"_MSG_infoBar"].join(""));
        } else {
            var infoBar = document.getElementById(["zv__CLV__", viewId,"_MSG_infoBar"].join(""));
        }
    }
    if (!infoBar) {
        return;
    }
    if (this._previousParentNode && document.getElementById("pm_bar_frame")) {
        this._previousParentNode.removeChild(document.getElementById("pm_bar_frame"));
    }
    this._previousParentNode = infoBar.parentNode;
    var newNode = document.createElement("div");
    newNode.style.width = "100%";
    newNode.id = "pm_bar_frame";
    infoBar.parentNode.insertBefore(newNode, infoBar.nextSibling);

    var callback = new AjxCallback(this, this._toolbarInfoFromMetadata);
    this._getCaseInfoMetada(this.currentMsg.id, callback);
};


/** Method to obtain information of the case with id saved in the metadata of the email to show them inside the toolbar
 * 
 *      @param {String} caseId : the case ID
 */
processMaker.prototype._toolbarInfoFromMetadata = function(caseId){
    //It check that the caseId is valid and who has made the login
    //The check of session expired is done when the response is processed
    if(caseId && this.pMakerAPI.sessionId){
        this.pm_bar_recordsForThisMsgParsed = false;
        this.pm_bar_expanded = false;

        var ErrCallback = new AjxCallback(this, this._toolbarInfoFromMetadata, caseId);
        var caseInfo = this.pMakerAPI._getCaseInfoOperation(caseId, ErrCallback);
        if(caseInfo.status_code == 0){ // Check that the case exist 
            this._do_addPMInfoBar(caseInfo);
        }
    }
};

/** Method that viewing detail case inside the processMaker bar
 * 
 *      @param {Object} objCaseInfo : the case info
 */
processMaker.prototype._do_addPMInfoBar = function(objCaseInfo) {
    var newNode = document.getElementById("pm_bar_frame");
    newNode.innerHTML = this._getPMBarWidgetHtml();
    this.changeOpac(0, newNode.style);
    this.opacity("pm_bar_frame", 0, 100, 500);
    this._addWidgetsToPMBar(objCaseInfo);
};

/** Set the onClick event on the PM bar
 * 
 *      @param {Object} objCaseInfo : the case info
 */
processMaker.prototype._addWidgetsToPMBar = function(objCaseInfo) {
    document.getElementById("pm_bar_mainHandler").onclick = AjxCallback.simpleClosure(this._pmBarExpandBtnListener, this, objCaseInfo);
};

/** Expand or collaps the PM bar
 * 
 *      @param {Object} objCaseInfo : the case info
 */
processMaker.prototype._pmBarExpandBtnListener = function(objCaseInfo) {
    if (!this.pm_bar_recordsForThisMsgParsed) {
        this._setResultsToPMBar(objCaseInfo);
    }
    if (!this.pm_bar_expanded) {
        document.getElementById("pm_expandCollapseIconDiv").className = "ImgHeaderExpanded";
        document.getElementById("pm_bar_generalToolbar").style.display = "block";
        document.getElementById("pm_bar_resultsMainDiv").style.display = "block";
        document.getElementById("pm_bar_msgCell").style.display = "none";
        this.pm_bar_expanded = true;
    } else {
        document.getElementById("pm_expandCollapseIconDiv").className = "ImgHeaderCollapsed";
        document.getElementById("pm_bar_generalToolbar").style.display = "none";
        document.getElementById("pm_bar_resultsMainDiv").style.display = "none";
        document.getElementById("pm_bar_msgCell").style.display = "block";
        this.pm_bar_expanded = false;
    }
};

/** Build the response in html that is inserted at the tab added to the email
 * 
 *      @param {Object} objCaseInfo : the case info
 */
processMaker.prototype._setResultsToPMBar = function(objCaseInfo) {
    var html = new Array();
    var i = 0;
    html[i++] = "<br/>";
    html[i++] = "<div  style='font-weight:bold;font-size:12px;background-color:#EFE7D4;padding:3px' width=100%>Case Information:</div>";
    html[i++] = "<div  style='font-weight:bold;font-size:14px;' width=100%>";
    html[i++] = "<table class='PM_table' cellpadding=2 cellspacing=0 border=0 width=100%>";
    html[i++] = "<tr><th width=15%>"+this.getMessage("nameProcess")+"</th><th width=15%>"+this.getMessage("numCase")+
            "</th><th width=17%>"+this.getMessage("nameCase")+"</th><th width=15%>"+this.getMessage("status")+"</th><th width=15%>"+this.getMessage("dataCreate")+"</th></tr>";
    var caseId = objCaseInfo.caseId ?objCaseInfo.caseId.toString() : "";
    var processName = objCaseInfo.processName ? objCaseInfo.processName.toString() : "";
    var caseNumber = objCaseInfo.caseNumber ? objCaseInfo.caseNumber.toString() : "";
    var caseName = objCaseInfo.caseName ? objCaseInfo.caseName.toString() : "";
    var caseStatus = objCaseInfo.caseStatus ? objCaseInfo.caseStatus.toString() : "";
    var createDate = objCaseInfo.createDate ? objCaseInfo.createDate.toString() : "";

    html[i++] = ["<td>",processName,"</td>"].join("");
    html[i++] = ["<td>",caseNumber,"</td>"].join("");
    html[i++] = ["<td>",caseName,"</td>"].join("");
    html[i++] = ["<td>",caseStatus,"</label></td>"].join("");
    html[i++] = ["<td>",createDate,"</td></tr>"].join("");

    html[i++] = "</table>";
    html[i++] = "</div>";
    document.getElementById("pm_bar_resultsMainDiv").innerHTML = html.join("");
};

/**	Method to manage the bar of processMaker
*/
processMaker.prototype._getPMBarWidgetHtml = function() {
    var html = new Array();
    var i = 0;
    if (!this._pmImage) {
        this._pmImage = ["<img  height=14px width=14px src=\"", this.getResource("resources/pm.gif") , "\"  />"].join("");
    }
    html[i++] = "<DIV class='overviewHeader'>";
    html[i++] = "<table cellpadding=0 cellspacing=0 width=100%><tr><td width='500'>";
    html[i++] = ["<div style='cursor:pointer' id='pm_bar_mainHandler'><table cellpadding=0 cellspacing=0><tr><td width=2px></td>",
            "<td width=11px><div id='pm_expandCollapseIconDiv' class='ImgHeaderCollapsed'></div></td><td width=2px></td>",
            "<td>",this._pmImage,"</td>",
            "<td width=2px></td><td width='102'><label style='font-weight:bold;color:rgb(55, 45, 45);cursor:pointer'>ProcessMaker Bar</label></td>",
            "<td id='pm_bar_msgCell'></td></tr></table></div></td>"].join("");
    html[i++] = "<td>";
    html[i++] = "<div id='pm_bar_generalToolbar' style='display:none'>";
    html[i++] = "<table class='PM_table'>";
    html[i++] = "<td id='pm_bar_addNotesBtn'></td><td id='pm_bar_email2CaseBtn'></td><td><div id='pm_bar_createNewMenuDiv'></div></td></tr></table></div>";
    html[i++] = "</td></tr></table>";
    html[i++] = "</DIV>";
    html[i++] = "<DIV  class='pm_bar_yellow'  id='pm_bar_resultsMainDiv'>";
    html[i++] = "</DIV>";
    return html.join("");
};

processMaker.prototype.opacity = function(id, opacStart, opacEnd, millisec) {
    //speed for each frame
    var speed = Math.round(millisec / 100);
    var timer = 0;
    var styleObj = document.getElementById(id).style;
    //determine the direction for the blending, if start and end are the same nothing happens
    if (opacStart > opacEnd) {
        for (i = opacStart; i >= opacEnd; i--) {
            setTimeout(AjxCallback.simpleClosure(this.changeOpac, this, i, styleObj), (timer * speed));
            timer++;
        }
    } else if (opacStart < opacEnd) {
        for (i = opacStart; i <= opacEnd; i++){
            setTimeout(AjxCallback.simpleClosure(this.changeOpac, this, i, styleObj), (timer * speed));
            timer++;
        }
    }
};

/** Change the opacity for different browsers
 * 
 *      @param {Integer} opacity : the opacity
 *      @param {String} styleObj : the style
 */
processMaker.prototype.changeOpac = function(opacity, styleObj) {
    styleObj.opacity = (opacity / 100);
    styleObj.MozOpacity = (opacity / 100);
    styleObj.KhtmlOpacity = (opacity / 100);
    styleObj.filter = "alpha(opacity=" + opacity + ")";
};

//************************************************************************************************
//************************************ Manager end PM Toolbar ************************************
//************************************************************************************************


//************************************************************************************************
//********************************* Manage start METADATA ****************************************
//************************************************************************************************

/** To do the SET of metadata
 *	@param {String} caseId : Id of the case to save
 */
processMaker.prototype.setCaseInfoMetada = function(caseId) {
    var metaData = new ZmMetaData(appCtxt.getActiveAccount(), this.currentMsg.id);
    var keyValArry = [];
    keyValArry["caseId"] = caseId;
    //To avoid possible override the metadata server due to change of PM was added to the server name as the key to rescue
    var sectionName = (this.pMakerAPI.server.length > 15) ? this.pMakerAPI.server.substring(0,15) : this.pMakerAPI.server;
    metaData.set("pmZimletCID" + sectionName, keyValArry, null, null, null, true);
};

/** To do the GET of metadata
 * 
 *	@param {String} msgid : Id of the selected email
 *	@param {AjxCallback} postCallback : A callback
 */
processMaker.prototype._getCaseInfoMetada = function(msgid, postCallback) {
    var metaData = new ZmMetaData(appCtxt.getActiveAccount(), msgid);
    var sectionName = (this.pMakerAPI.server.length > 15) ? this.pMakerAPI.server.substring(0,15) : this.pMakerAPI.server;
    metaData.get("pmZimletCID" + sectionName, null, new AjxCallback(this, this._handleGetMesgMetaData, postCallback));
};

/** Handles appointment and webex response.
 * 
 *	@param {AjxCallback} postCallback : A callback
 * 	@param {object} result : Custom metadata response
 */
processMaker.prototype._handleGetMesgMetaData = function(postCallback, result) {
    this._caseIdMetaData = null;//nullify old data
    var response = result.getResponse();
    if(response && response.BatchResponse && response.BatchResponse.GetCustomMetadataResponse){
        response = response.BatchResponse.GetCustomMetadataResponse;
    }else{
        return;
    }
    try {
        if (response[0].meta && response[0].meta[0]) {
            this._caseIdMetaData = response[0].meta[0]._attrs.caseId ;
        }
        if (postCallback) {
            postCallback.run(this._caseIdMetaData);
        }else{
            return this._caseIdMetaData;
        }
    } catch(ex) {
        this.displayErrorMessage(ex);
        return;
    }
};

//************************************************************************************************
//*********************************** Manage end METADATA *************************************
//************************************************************************************************


//************************************************************************************************
//************************************** Manage start TAG *************************************
//************************************************************************************************

/** Check if the tag exists
 */
processMaker.prototype._checkAndCreateTag = function() {
    this._tagName = "ProcessMaker";
    this._createTagAndStoreId();
};

/** Creates Tags and stores its id
 */
processMaker.prototype._createTagAndStoreId = function () {
    var tagObj = appCtxt.getActiveAccount().trees.TAG.getByName(this._tagName);
    if (!tagObj) {
        this._createTag({
            name: this._tagName,
            color: ZmOrganizer.C_BLUE,
            callback: new AjxCallback(this, this._handleTagCreation)
        });
    } else {
        this._tagId = tagObj.nId;
    }
};

/** Creates tags
 * 	@param {Object} params Object that defines a tag like: name, color etc
 */
processMaker.prototype._createTag = function (params) {
    var soapDoc = AjxSoapDoc.create("CreateTagRequest", "urn:zimbraMail");
    var tagNode = soapDoc.set("tag");
    tagNode.setAttribute("name", params.name);
    var color = ZmOrganizer.checkColor(params.color);
    if (color && (color !== ZmOrganizer.DEFAULT_COLOR[ZmOrganizer.TAG])) {
        tagNode.setAttribute("color", color);
    }
    appCtxt.getAppController().sendRequest({ soapDoc: soapDoc, asyncMode: true, callback: params.callback });
};

/**
 * 	@param {Object} response : Create Tag response
 */
processMaker.prototype._handleTagCreation = function (response) {
    try {
        this._tagId = response.getResponse().CreateTagResponse.tag[0].id;
    } catch (e) {}
};

/** Tags or untags
 * 	@param {Boolean} doTag : true, tags an email
 * 	@param {String} itemId : the item ID
 * 	@param {String} tagId : the tag ID
 */
processMaker.prototype._addTag = function (doTag, itemId, tagId) {
    var axnType = (doTag)?"tag":"!tag";
    var soapCmd = ZmItem.SOAP_CMD["MSG"] + "Request";
    var itemActionRequest = {};
    itemActionRequest[soapCmd] = {_jsns:"urn:zimbraMail"};
    var request = itemActionRequest[soapCmd];
    var action = request.action = {};
    action.id = itemId;
    action.op = axnType;
    action.tag = tagId;
    var params = {asyncMode: true, callback: null, jsonObj:itemActionRequest};
    appCtxt.getAppController().sendRequest(params);
};

//************************************************************************************************
//************************************** Manage end TAG ******************************************
//************************************************************************************************

//************************************************************************************************
//********************************** Start utility function **************************************
//************************************************************************************************

/** Method to viewing of objects
 * 
 *      @param {Object} inobj : the object
 */
function mostra(inobj) {
    var op = window.open();
    op.document.open('text/plain');
    for (var objprop in inobj) {
            op.document.write(objprop + ' => ' + inobj[objprop] + '\n');
    }
    op.document.close();
}

/** Determine if an element is in array
 * 
 *      @param {Array} arr : the array
 *      @param {String} element : the element to search
 */
function inArray (arr, element){
    var i = 0;
    for ( var value = arr[0]; i < arr.length && value !== element; value = arr[++i] ){}
    if(i < arr.length){
            return i;
    }
    return -1;
}	

/** Obtain what browser we are using
*/
processMaker.prototype._getBrowser = function() {
    var browser = AjxEnv;
    if(browser.isIE){
            return 'IE';
    }else if(browser.isFirefox){
            return 'FF';
    }else if(browser.isChrome){
            return 'CH';
    }
};

processMaker.prototype._convertEscape = function(str){
    str = str.replace(/\n/g, "\\n");
    str = str.replace(/\r/g, "\\r");
    str = str.replace(/"/g, "\\\"");
    str = str.replace(/'/gm,"\\\'");
    return str;
};

//************************************************************************************************
//************************************ End utility function **************************************
//************************************************************************************************
