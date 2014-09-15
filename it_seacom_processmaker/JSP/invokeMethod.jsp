<%@page contentType="application/json; charset=UTF-8" import="it.seacom.invoke.Soap"%>
<%@page import="org.json.JSONArray"%>
<%@page import="org.json.JSONObject"%>
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
String operation = request.getParameter("operation");
String parameters = request.getParameter("parameters");
String server= (String)request.getParameter("server");
String workspace= (String)request.getParameter("workspace");
String port=(String)request.getParameter("port");
String protocol=(String)request.getParameter("protocol");
String language=(String)request.getParameter("language");

port=port!=null?port:"80";
protocol=protocol!=null?protocol:"http";
//String urlValue = "http://".concat(server);
//String strUrl=urlValue.concat(":80/sys").concat(workspace!=null?workspace:"workflow").concat("/" + language).concat("/green/services/soap2");

String urlValue =protocol.concat("://").concat(server);
String strUrl=urlValue.concat(":").concat(port).concat("/sys").concat(workspace!=null?workspace:"workflow").concat("/en/green/services/soap2");

if (operation != null && !operation.isEmpty()) {
	
	try {
		URL url = new URL(strUrl);

		String str = null;
		if ("login".equalsIgnoreCase(operation)) {
			str = Soap.invoke(url, namespace, operation, operation.concat("Response"), parameters, null);
		} else if ("sendVariables".equalsIgnoreCase(operation)) {
			str = Soap.invoke(url, namespace, operation.concat("Request"), "pmResponse", parameters, null);
		} else {
			str = Soap.invoke(url, namespace, operation, parameters);
		}
		response.getWriter().print(str);
	
	} catch(Exception e) {
		e.printStackTrace();
	}
}
%>