<%@page contentType="application/json; charset=UTF-8" import="it.seacom.invoke.Soap"%>
<%@page import="org.json.JSONArray"%>
<%@page import="org.json.JSONObject"%>
<%@page import="java.util.Date"%>
<%@page import="java.text.SimpleDateFormat"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Map.Entry"%>
<%@page import="java.util.Iterator"%>
<%@page import="java.net.URL"%>
<%@ page language="java" import="
java.net.MalformedURLException,
java.util.HashMap,
java.util.Map" %>

<%

String namespace = "http://www.processmaker.com";
String lastCheckNewCasesStr = (String)request.getParameter("lastCheckNewCases");
String sessionId = (String)request.getParameter("sessionId");
String cases = request.getParameter("casesList");
String server = (String)request.getParameter("server");
String workspace = (String)request.getParameter("workspace");
String port = (String)request.getParameter("port");
String protocol = (String)request.getParameter("protocol");
String language = (String)request.getParameter("language");
port = port!=null?port:"80";
protocol = protocol!=null?protocol:"http";
//String urlValue = "http://".concat(server);
//String strUrl = urlValue.concat(":80/sys").concat(workspace!=null?workspace:"workflow").concat("/" + language).concat("/green/services/soap2");

String urlValue = protocol.concat("://").concat(server);
String strUrl = urlValue.concat(":").concat(port).concat("/sys").concat(workspace!=null?workspace:"workflow").concat("/" + language).concat("/green/services/soap2");

String[] casesList = cases.split(",");
String parameters = null;
String jsonResponse = null;
JSONObject jsonObj = null;
JSONObject jsonObjResponse = null;
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
URL url = new URL(strUrl);
Date createDate = null;
Boolean flagNewCase = false;
Boolean flagError = false;
int typeError = 0;
int i = 0;
Date lastCheckNewCases = new Date();
if(lastCheckNewCasesStr.equals("predefined") == false){
	lastCheckNewCases.setTime(Long.parseLong(lastCheckNewCasesStr));
}

try {
	while(flagError == false && flagNewCase == false && i < casesList.length){
		parameters = "{'sessionId':'" + sessionId + "', 'caseId':'" + casesList[i] + "'}";
		jsonResponse = Soap.invoke(url, namespace, "getCaseInfo", parameters);
		jsonObj = new JSONObject(jsonResponse);	
		if(jsonObj.getInt("status_code") == 0){ 
			createDate = sdf.parse(jsonObj.getString("createDate"));
			if(lastCheckNewCasesStr.equals("predefined") == true || lastCheckNewCases.getTime() < createDate.getTime()){
				flagNewCase = true;
			}else{
				i++;
			}
		}else if(jsonObj.getInt("status_code") == 9){
			flagError = true;
			typeError = 9;
		}else{
			flagError = true;
			typeError = jsonObj.getInt("status_code");
		}
	}
} catch(Exception e) {
	e.printStackTrace();
}

jsonObjResponse = new JSONObject().put("esito", flagNewCase);
if(flagError == true){
	jsonObjResponse.put("status_code", typeError);
}
response.getWriter().print(jsonObjResponse.toString());


%>
