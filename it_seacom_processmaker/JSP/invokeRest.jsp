<%@page contentType="application/json; charset=UTF-8" import="it.seacom.invoke.Rest"%>
<%@page import="org.json.JSONArray"%>
<%@page import="org.json.JSONObject"%>
<%@page import="org.json.XML"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Map.Entry"%>
<%@page import="java.util.Iterator"%>
<%@page import="java.io.File"%>
<%@page import="java.net.URL"%>
<%@ page language="java" import="
java.net.MalformedURLException,
java.util.HashMap,
java.util.Map,
it.seacom.invoke.Rest.CONTENT_TYPE,
it.seacom.invoke.Rest.REQUEST_TYPE,
it.seacom.pdf.PDFTextParser" %>
<%


String query="Order?where=Documentno=";
String nameFile=(String)request.getParameter("nameFile");
String pathFile="/tmp/".concat(nameFile);
String result;
String user = (String)request.getParameter("openBravoLogin");
String password = (String)request.getParameter("openBravoPassword");
String server = (String)request.getParameter("openBravoUrl");
String strUrl = "http://".concat(server);
String propertyName = "Preventivo numero";
				  
				  File pdfFile = new File(pathFile);
				  pdfFile = new File(pathFile);
				  String propertyValue = PDFTextParser.extractProperty(propertyName, pdfFile);
				  if (propertyValue != null) {
					  query = query.concat("'").concat(propertyValue).concat("'");
					  System.out.println("strUrl: " + strUrl);
					  System.out.println("query: " + query);
					  try {
					   result = Rest.invoke(REQUEST_TYPE.GET, strUrl.concat(query), null, null,user,password);
					   JSONObject jObj = XML.toJSONObject(result);
					   jObj.append("NumPreventivo", propertyValue);
					   System.out.println(jObj.toString());
					   response.getWriter().print(jObj);
					  } catch(Exception e) {
					   e.printStackTrace();
					  }
					}

%>