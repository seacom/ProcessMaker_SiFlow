<%@ page import="it.seacom.attachment.ClasseSave"%>
<%@ page import="com.zimbra.cs.account.Account"%>
<%@ page import="com.zimbra.cs.account.Provisioning"%>
<%@ page import="com.zimbra.cs.account.AuthToken"%>
<%@ page import="com.zimbra.common.account.Key.AccountBy"%>
<%@ page import="com.zimbra.client.*"%>
<%@ page import="java.io.File"%>
<%@ page language="java" contentType="text/html; charset=UTF-8" %>

<%
Cookie cookies[] = request.getCookies();
Account account;
String authTokenStr = null;
if (cookies != null) {
	int i = 0;
	do {
		if (i >= cookies.length)
			break;
		if (cookies[i].getName().equals("ZM_AUTH_TOKEN")) {
			authTokenStr = cookies[i].getValue();
			break;
		}
		i++;
	} while (true);
}

AuthToken token;
try {
	token = AuthToken.getAuthToken(authTokenStr);
	Provisioning prov = Provisioning.getInstance();
	account = prov.get(AccountBy.id, token.getAccountId());

	// Recuperation des parametres passes par le ficher
	// com_zimbra_save.xml
	String id = request.getParameter("id");

	// Recuperation du type d'objet a sauvegarder
	String type = request.getParameter("type");

	if (type.indexOf(',') != -1) {
		type = type.substring(0, type.indexOf(','));
	}

	String numMsgs = "";
	if (type.equals("ZmConv")) {
		numMsgs = request.getParameter("numMsgs");
	}

	// Creation d'une instance de la classe Save
	ClasseSave cs = new ClasseSave(account.getMail());

	// Fin de la recuperation des parametres passes par le ficher
	// com_zimbra_save.xml
	// Reconversion des parametres qui etaient des booleans
	File temporaryFolder = new File("/tmp");

	// Calcul du nombre de messages ou de conversations glisses
	String ids = id;
	int l = ids.indexOf(',');
	int nbDnD = 1; // Nombre de messages ou de conversations glisses
	while (l != -1) {
		nbDnD = nbDnD + 1;
		ids = ids.substring(l + 1);
		l = ids.indexOf(',');
	}
	// Fin calcul du nombre de messages ou de conversations glisses
	// Declaration des variables servant a recuperer
	// Le contenu des messages ou des conversations
	String ident = ""; // id du message ou de la conversation
	int j = 0;
	int k = 0;
	int index;

	// Parcours des conversations selectionnees
	for (int i = 1; i <= nbDnD; i++) {
		// Recuperation du nombre de messages de la conversation
		if (type.equals("ZmConv")) {
			index = numMsgs.indexOf(',', j);
			j = index + 1;
		}
		// Recuperation de l'id du message ou de la conversation
		index = id.indexOf(',', k);
		if (index != -1) {
			ident = id.substring(k, index);
		} else {
			ident = id.substring(k);
		}
		k = index + 1;
		// Recuperation de tous les messages de la conversation ou du
		// repertoire
		if (type.equals("ZmConv") || type.equals("ZmFolder")) {
			try {
				cs.handleConversation(ident, temporaryFolder);
			} catch (Exception e) {
			}
		} else if (type.equals("ZmMailMsg")) {
			try {
				cs.handleMessage(ident, temporaryFolder);
			} catch (Exception e) {
			}
		}
	}

} catch (Exception e) {
	e.printStackTrace();
}

%>
