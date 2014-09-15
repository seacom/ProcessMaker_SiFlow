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

/** Constructor
 *	
 *	@param {Object} parent : parent object
 */
function processMakerAPI(parent){
    this.parent = parent;
    this.sessionId = null;
    this.xmlNs = "http://processmaker.com";
}

//******************************************************************************
//********************************** Login *************************************
//******************************************************************************

/** Runs the login with PM
 *
 *	@param {AjxCallback} postCallback : Callback runs after the login
 *	@param {boolean} viewStatus : Indicates whether you should show the login message status  
 */
processMakerAPI.prototype._login = function(postCallback, viewStatus) {
    //Save the value setted from preferences menu of the zimlet
    this.user = this.parent.getUserProperty("user");
    this.passwd = this.parent.getUserProperty("passwd");
    this.server = this.parent.getUserProperty("server");
    this.workspace = this.parent.getUserProperty("workspace");
    this.language = "en";
    this.port = this.parent.getUserProperty("port");
    this.protocol = this.parent.getUserProperty("protocol");
    this.snooze = this.parent.getUserProperty("snooze");
    this.dateSnooze = this.parent.getUserProperty("dateSnooze");
    this.lastCheckNewCases = this.parent.getUserProperty("lastCheckNewCases");
    var errorMessage = "";
    if (!this.user){
        errorMessage += "<b>-</b> User<br>";
    }
    if (!this.passwd){
        errorMessage += "<b>-</b> Password<br>";
    }
    if (!this.server){
        errorMessage += "<b>-</b> Server<br>";
    }
    if (!this.workspace){
        errorMessage += "<b>-</b> Workspace<br>";
    }
    if(errorMessage !== ""){
        errorMessage = this.parent.getMessage("Pleasecompleteyourpreferencesfirst") + "<hr><br>" + errorMessage;
        this.parent.displayErrorMessage(errorMessage);
    }else {
        var soap = this._makeEnvelope("login");
        soap.set("userid", this.user);
        soap.set("password", this.passwd);
        this._sendRequest(soap, new AjxCallback(this, this._loginCallback, [postCallback, viewStatus]), "WS");
    }
};

/** Processes the response after login 
 *  	@param {AjxCallback} callback : The callback
 *	@param {boolean} viewStatus : Indicates whether you should show the login message status
 *	@param {ObjectXML} response : The content of the response after login
 */
processMakerAPI.prototype._loginCallback = function(callback, viewStatus, response){
    this.sessionId = null;
    if(this.parent._isValidResponse(response.success, 'login') == false) { return; }
    var xmlResponse = new AjxXmlDoc.createFromDom(response.xml);
    var jsonObj = xmlResponse.toJSObject(true, false);
    jsonObj = jsonObj.Body.pmResponse;
    //If login has had success, it will contain the session id of PM
    var message = jsonObj.message.toString();
    var statusCode = jsonObj.status_code.toString();

    if(statusCode == 0){ //Command executed successfully
        if(viewStatus == true){
            this.parent.displayStatusMessage(this.parent.getMessage("loginSuccess"));
        }
        this.sessionId = message;
        if(callback){
            callback.run();
        }
    }else{ //Login failed
        this.parent.displayErrorMessage(message);
        if(this.parent._PmTab){
            this.parent._initPmTab(); // Inizializzo il Tab di PM
        }
    }	
};


//******************************************************************************
//***************************** unassignedCaseList *****************************
//******************************************************************************

/** Call the procedure unassignedCaseList
 *	@return {boolean} : TRUE if it has been found at least an unassigned case, FALSE otherwise
 */
processMakerAPI.prototype._getUnassignedCase = function() {
    var jspUrl = this.parent.getResource("JSP/invokeMethod.jsp");
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    var variableParameters = ['"', 'sessionId', '":"', this.sessionId, '"'].join("");
    var param = ['operation=unassignedCaseList', '&parameters={', variableParameters, '}', '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    var response = AjxRpc.invoke(param, jspUrl, hdrs, null, false);
    var jsonObj = JSON.parse(response.text);
    //Save the content of response in a global variable
    if(jsonObj && typeof(jsonObj['cases'][0]) == 'undefined'){
        this.parent._casesResult = {};
        this.parent._casesResult['cases'] = [];
        this.parent._casesResult['cases'].push(jsonObj['cases']);							
    }else{
        this.parent._casesResult = jsonObj;
    }
    return jsonObj !== null; 	
};


//******************************************************************************
//******************************** getCaseInfo *********************************
//******************************************************************************

/** Call the procedure getCaseInfo to obtain all information of this case
*	
*	@param {String} caseId : Id of the case
*	@param {AjxCallback} ErrCallback : callback runs when the session is expired, after we have runs again the login
*
*	@return {Object}
*/
processMakerAPI.prototype._getCaseInfoOperation = function(caseId, ErrCallback) {
    var jspUrl = this.parent.getResource("JSP/invokeMethod.jsp");
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    var variableParameters = ['"', 'sessionId', '":"', this.sessionId, '","', 'caseId', '":"', caseId, '"'].join("");
    var param = ['operation=getCaseInfo', '&parameters={', variableParameters, '}', '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    var response = AjxRpc.invoke(param, jspUrl, hdrs, null, false);
    var jsonObj = JSON.parse(response.text);
    var caseInfoObject = {};
    if(jsonObj.status_code == 0){
        caseInfoObject = jsonObj;
    }else if(jsonObj.status_code == 9){
        this._login(ErrCallback);
    }else{
        caseInfoObject['status_code'] =  jsonObj.status_code;
        caseInfoObject['message'] =  jsonObj.message;
    }
    return caseInfoObject;
};

//******************************************************************************
//************************** inputDocumentProcessList **************************
//******************************************************************************

/** Call the procedure inputDocumentProcessList that return the UID of input document defined in processmaker during the phase of design
 *
 *	@param {String} processId : Id of the selected process from the available list process of this user
 *	@param {String} name : "Attached"
 */
processMakerAPI.prototype._inputDocumentProcessList = function(processId, name) {
    var jspUrl = this.parent.getResource("JSP/invokeMethod.jsp");
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    var variableParameters = ['"', 'sessionId', '":"', this.sessionId, '","', 'processId', '":"', processId, '"'].join("");
    var param = ['operation=inputDocumentProcessList', '&parameters={', variableParameters, '}', '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    var response = AjxRpc.invoke(param, jspUrl, hdrs, null, false);
    var jsonObj = JSON.parse(response.text);
    if(jsonObj){
        for (var i = 0; i < jsonObj.documents.length; i++ )  {
            lookupItem = new Object();
            lookupItem = jsonObj.documents[i];
            if(lookupItem.name == name){
                attachedFileID = lookupItem.guid;
            }
        }
    }	
    return attachedFileID;
};


//******************************************************************************
//***************************** getVariablesNames ******************************
//******************************************************************************

processMakerAPI.prototype._getVariablesNames = function(caseId) {
    var jspUrl = this.parent.getResource("JSP/invokeMethod.jsp");
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    var variableParameters = ['"', 'sessionId', '":"', this.sessionId, '","', 'caseId', '":"', caseId, '"'].join("");
    var param = ['operation=getVariablesNames', '&parameters={', variableParameters, '}', '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    var response = AjxRpc.invoke(param, jspUrl, hdrs, null, false);
    var jsonObj = JSON.parse(response.text);
    return jsonObj;
};



//******************************************************************************
//******************************* sendVariables ********************************
//******************************************************************************


/** Method that invoke the .jsp file to run the operation of sendVariables of WS of processMaker. The Zimbra object are sent in a Json structure a PM.
 * 
 *  	@param {String} caseID : The case ID
 *	@param {ZmMailMsg} obj : The email
 */
processMakerAPI.prototype._sendVariables = function(caseID, obj) {
    var isSent = this.parent._isSentEmail(obj);
    var fromData = this.parent._getMsgData(obj, AjxEmailAddress.FROM);
    var toData = this.parent._getMsgData(obj, AjxEmailAddress.TO).addressTo.join(",");
    var ccData = this.parent._getMsgData(obj, AjxEmailAddress.CC).addressTo.join(",");
    var bccData = this.parent._getMsgData(obj, AjxEmailAddress.BCC).addressTo.join(",");
    var replyToData = this.parent._getMsgData(obj, AjxEmailAddress.REPLY_TO).addressTo.join(",");
    var subjectData = encodeURIComponent(this.parent._getSubjectEmail(obj));
    var bodyText = this.parent._getMailBodyAsText(obj);
    bodyText = this.parent._convertEscape(bodyText);
    bodyText = encodeURIComponent(bodyText);
    bodyText = (bodyText.length > 4000) ? bodyText.substring(0, 3222) + "..." : bodyText;
    var fromEmailAddr = fromData.addressTo.join(",");
    var sentDateEmail = this.parent._getSentDateEmail(obj);
    var attachData = [];
    var filename = "";
    var pathUrlAttched = "";
    var partPathUrl = "";
    if(obj.attachments){
        for (var i = 0; i < obj.attachments.length; i++){
            filename = obj.attachments[i].filename;
            pathUrlAttched = obj._attInfo[i].url;
            partPathUrl = pathUrlAttched.split('~')[0];
            attachData.push(filename + "-" + partPathUrl);
        }
    }
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    var jspUrl = this.parent.getResource("JSP/invokeMethod.jsp");
    var jsonData = ['[{"name":"zpmIsSentEmail", "value":"', isSent, '"},{"name":"zpmReplyToData", "value":"', replyToData, '"},{"name":"zpmToData", "value":"', toData, '"},{"name":"zpmSentDateEmail", "value":"', sentDateEmail, '"},{"name":"zpmCcData", "value":"', ccData, '"},{"name":"zpmBccData", "value":"', bccData, '"},{"name":"zpmSubject", "value":"', subjectData, '"},{"name":"zpmFromName", "value":"', fromData.nameTo.join(","), '"},{"name":"zpmFromEmail", "value":"', fromEmailAddr, '"},{"name":"zpmBody", "value":"', bodyText, '"},{"name":"zpmAttachData", "value":"', attachData, '"},{"name":"pmServerUrl", "value":"', this.server, '"}]'].join("");
    var variableParameters = ['"', 'sessionId', '":"', this.sessionId, '","', 'caseId', '":"', caseID, '","', 'variables', '":', jsonData].join("");
    var param = ['operation=sendVariables', '&parameters={', variableParameters, '}', '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    var response = AjxRpc.invoke(param, jspUrl, hdrs, null, false);
    var jsonObj = JSON.parse(response.text);
    if(jsonObj.status_code == 9){
        var postCallback = new AjxCallback(this, this._sendVariables, [caseID, obj]);
        this._login(postCallback);
    }
};


//******************************************************************************
//******************************* processList **********************************
//******************************************************************************

/** Call the procedure processList
 */
processMakerAPI.prototype._processList = function() {
    var soap = this._makeEnvelope("processList");
    soap.set("sessionId", this.sessionId);
    var callback = new AjxCallback(this.parent, this.parent._selectProcessView);
    this._sendRequest(soap, callback, true, "WS");
};

//******************************************************************************
//********************************* newCase ************************************
//******************************************************************************

/** Call the procedure newCase
 *
 *	@param {String} processId : Id of the selected process from the available list process of this user
 */
processMakerAPI.prototype._newCase = function(processId) {
    var soap = this._makeEnvelope("newCase");
    soap.set("sessionId", this.sessionId);
    soap.set("processId", processId);
    var callback = new AjxCallback(this.parent, this.parent._newCaseCallback, processId);
    this._sendRequest(soap, callback, true, "WS");
};

//******************************************************************************
//******************************** caseList ************************************
//******************************************************************************

/** Call the procedure caseList
 *
 *	@param {AjxCallback} callback : callback that processes the response of the procedure
 */
processMakerAPI.prototype._caseList = function(callback) {
    var soap = this._makeEnvelope("caseList");
    soap.set("sessionId", this.sessionId);
    this._sendRequest(soap, callback, true, "WS");
};


/** SOAP utils : Utility function that creates a SOAP envelope.  This will also insert the
 *  session header if we already have a session.
 *  
 *   	@param {String} method : the name of the procedure
 */
processMakerAPI.prototype._makeEnvelope = function(method) {
    var soap = AjxSoapDoc.create(method, this.xmlNs, null, "http://schemas.xmlsoap.org/soap/envelope/");
    var envEl = soap.getDoc().firstChild;
    envEl.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    envEl.setAttribute("xmlns:xsd", "http://www.w3.org/2001/XMLSchema");
    if (this.sessionId) {
        var header = soap.ensureHeader();
        var sessionEl = soap.getDoc().createElement("SessionHeader");
        header.appendChild(sessionEl);
        sessionEl.setAttribute("xmlns:ns1", this.xmlNs);
        soap.set("sessionId", this.sessionId, sessionEl);
    }
    return soap;
};

/** Utility function that calls the PM server with the given SOAP data
 * 
 *      @param {AjxSoapDoc} soap : the soap request
 *   	@param {AjxCallback} callback : the callback
 *   	@param {Boolean} passErrors : the name of the procedure
 *   	@param {String} targetMethod : the target method
 */
processMakerAPI.prototype._sendRequest = function(soap, callback, passErrors, targetMethod) {	
    this.parent.sendRequest(soap, this._getServerHostPm(targetMethod), {SOAPAction: "m", "Content-Type": "text/xml"}, callback, false, passErrors);	
};

/** Create the PM url to call upon to the method
 * 
 *      @param {String} targetMethod : the target method
 *      @param {Object} params : SOAPAction and Content-Type
 *
 */
processMakerAPI.prototype._getServerHostPm = function(targetMethod, params) {
    var processmakerskin = "classic";
    var lang = "en";
    var serverHostFinal = "";
    //Protocol
    serverHostFinal += this.protocol + "://";
    //Server Host
    serverHostFinal += this.server;
    //Port
    if(this.port !== ""){
        serverHostFinal += ":" + this.port;
    }
    //workspace
    serverHostFinal += "/sys" + this.workspace + "/";
    //Lang
    serverHostFinal += lang + "/";
    //Skin
    serverHostFinal += processmakerskin + "/";
    //Target
    if(!targetMethod) targetMethod = "WS";

    var structServerHost = { 
        "WS" : { "url" : "services/soap", "param" : "" }, 
        "openCase" : { "url" : "cases/cases_Open", "param" : "?" },
        "startCase" : { "url" : "cases/casesStartPage?action=startCase", "param" : "&" },
        "casesList" : { "url" : "cases/casesListExtJs", "param" : "?" },
        "casesDoc" : { "url" : "cases/casesStartPage?action=documents", "param" : "&" },
        "casesPaused" : { "url" : "cases/casesListExtJs?action=paused", "param" : "&" },
        "casesSelfService" : { "url" : "cases/casesListExtJs?action=selfservice", "param" : "&" },
        "casesSent" : { "url" : "cases/casesListExtJs?action=sent", "param" : "&" },
        "casesDraft" : { "url" : "cases/casesListExtJs?action=draft", "param" : "&" },
        "cases_Step" : { "url" : "cases/cases_Step?action=steps", "param" : "&" },
        "cases_Open" :	{ "url" : "cases/open?action=draft", "param" : "&" },
        "OpenAssigned" : { "url" : "cases/open?action=todo", "param" : "&" },
        "casesInbox" :	{ "url" :  "cases/casesListExtJs?action=todo", "param" : "&" }
    };
    serverHostFinal += structServerHost[targetMethod]['url'];
    if(structServerHost[targetMethod]['param'] !== "") {
        serverHostFinal += structServerHost[targetMethod]['param'] + params;
    }
    return serverHostFinal;
};

processMakerAPI.prototype._checkNewUnassignedcase = function(casesList) {
    var arrCaseid = [];
    for(obj in casesList){
        arrCaseid.push(casesList[obj]['guid']); 
    }
    var jspUrl = this.parent.getResource("JSP/checkNewUnassignedCase.jsp");
    var callback = new AjxCallback(this, this._checkNewUnassignedcaseCallback, [casesList]);
    var hdrs = [];
    hdrs["Content-type"] = "application/x-www-form-urlencoded";
    this.lastCheckNewCases = this.parent.getUserProperty("lastCheckNewCases");
    var param = ['lastCheckNewCases=', this.lastCheckNewCases ,'&casesList=', arrCaseid, '&sessionId=', this.sessionId, '&language=', this.language, '&server=', this.server,'&workspace=', this.workspace,'&port=', this.port,'&protocol=', this.protocol].join("");
    AjxRpc.invoke(param, jspUrl, hdrs, callback, false);
};


processMakerAPI.prototype._checkNewUnassignedcaseCallback = function(casesList, response) {
    var flagIsNewUnassignedCase = JSON.parse(response.text);
    if(flagIsNewUnassignedCase.esito == false){
        if(flagIsNewUnassignedCase.status_code == 9){
            this._login(new AjxCallback(this, this._checkNewUnassignedcase, [casesList]));
        }
    }
    this.parent._checkNewUnassignedCasesCallback(flagIsNewUnassignedCase.esito);
};
