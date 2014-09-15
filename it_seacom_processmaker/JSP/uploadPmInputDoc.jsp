<%@page import="java.io.PrintWriter"%>
<%@page import="java.io.ByteArrayOutputStream"%>
<%@page import="java.io.InputStream"%>
<%@page import="java.io.File"%>
<%@page import="org.apache.http.client.params.ClientPNames"%>
<%@page import="org.apache.http.util.EntityUtils"%>
<%@page import="org.apache.http.HttpEntity"%>
<%@page import="org.apache.http.HttpResponse"%>
<%@page import="org.apache.http.entity.mime.content.StringBody"%>
<%@page import="org.apache.http.entity.mime.content.FileBody"%>
<%@page import="org.apache.http.entity.mime.content.ContentBody"%>
<%@page import="org.apache.http.entity.mime.MultipartEntity"%>
<%@page import="org.apache.http.client.methods.HttpPost"%>
<%@page import="org.apache.http.impl.client.DefaultHttpClient"%>
<%@page import="com.zimbra.common.util.*"%>
<%@ page language="java" %> 
<%@ page import="javax.servlet.*" %>
<%
	PrintWriter pw = response.getWriter();
	DefaultHttpClient httpclient = new DefaultHttpClient();
	httpclient.getParams().setLongParameter(ClientPNames.CONN_MANAGER_TIMEOUT, 10000);

	//String caseID = "385990222506ea150bf2799039040593";
	//String userID = "4248559144fe78fe64b85e8015324635";
	//String index = "1";
	//String docId = "865563415506571e2c3aa83004253810";
	String appDoUID = "INPUT";
	String title = "Titolo";
	String comment = "Commento";
	 
	String caseID=(String)request.getParameter("caseID");
	String nameFile=(String)request.getParameter("nameFile");
    String userID=(String)request.getParameter("userID");
	String docId=(String)request.getParameter("docID");
	String index=(String)request.getParameter("index");
	String server=(String)request.getParameter("server");
	String workspace=(String)request.getParameter("workspace");
	String protocol=(String)request.getParameter("protocol");
	String port=(String)request.getParameter("port");
	port=port!=null?port:"80";
	protocol=protocol!=null?protocol:"http";
	String urlValue =protocol.concat("://").concat(server);
	String strUrl=urlValue.concat(":").concat(port).concat("/sys").concat(workspace!=null?workspace:"workflow").concat("/en/green/services/upload");
	System.out.println("nameFile :"+nameFile);
	HttpPost httppost = new HttpPost(strUrl);
	String pathFile="/tmp/".concat(nameFile);
	File file = new File(pathFile);
	MultipartEntity mpEntity = new MultipartEntity();
	//ContentBody cbFile = new FileBody(file, "text/plain");
    ContentBody cbFile = new FileBody(file, "text/plain", "UTF-8");
	mpEntity.addPart("ATTACH_FILE", cbFile);
	mpEntity.addPart("APPLICATION", new StringBody(caseID));
	mpEntity.addPart("INDEX", new StringBody(index));
	mpEntity.addPart("USR_UID", new StringBody(userID));
	mpEntity.addPart("DOC_UID", new StringBody(docId));
	mpEntity.addPart("APP_DOC_TYPE", new StringBody(appDoUID));
	mpEntity.addPart("TITLE", new StringBody(title));
	mpEntity.addPart("COMMENT", new StringBody(comment));

	httppost.setEntity(mpEntity);

	HttpResponse clientResponse = httpclient.execute(httppost);
	HttpEntity resEntity = clientResponse.getEntity();

	try {
		response.setStatus(clientResponse.getStatusLine().getStatusCode());
	} catch (Exception e) {
		response.setStatus(500);
	}

	try {
		response.setContentType(resEntity.getContentType().getValue());
	} catch (Exception e) {
		response.setContentType("text/plain");
	}

	InputStream is = resEntity.getContent();
	ByteArrayOutputStream baos = new ByteArrayOutputStream();
	byte[] buffer = new byte[1024];
	int r = 0;
	while((r = is.read(buffer)) != -1) {
		baos.write(buffer, 0, r);
	}
	String res = baos.toString();
	
	baos.flush();
	baos.close();
	
	pw.print(res);

	if (resEntity != null) {
		EntityUtils.consume(resEntity);
	}
	
	try {
		file.delete();
	} catch(Exception e) {
		e.printStackTrace();
	}
	
	httpclient.getConnectionManager().shutdown();
	
%>
