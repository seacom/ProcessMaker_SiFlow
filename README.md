Zimlet SiFlow
======

Seacom, the Italian distributor of Zimbra and ProcessMaker, analyzes, implements and realizes, through the integration between the two solutions, processes that can be triggered by emails sent or received, which can be managed directly from the Zimbra webmail, simplifying the work of every day.

Currently this zimlet only works with a Zimbra 8.

Installation
============

To install the Zimlet on Web Client the procedure to make is this:
Log on to the administrative interface of Zimbra
Select the option Configure → Zimlet (on the left column )
In the new screen that will open, click on the mechanical wheel 
(in the high right ) and then implements 
Select the file through Choose File, and mark the voice Flush cache Zimlet  and then implements
When all entries have the status Done select the End key. 



The COS changes to be made are:
Select the Zimlet Tab, and check if Zimlet SiFLOW has the status active (otherwise activate )
Select the COS of user that will use SiFLOW
Select the Advanced option
Verify or add the domain of your company in the Proxy domain available.
Press Save to confirm the changes.

Briefly, the installation of the Zimlet on WebMail :
administrative interface of Zimbra → Configure → Zimlet → Implement → 
Choose file/Select Flush Cache Zimlet → Implement → End → Configure →Class of Service → 
Select COS → Advanced → Verify or add the domain of your company in the Proxy domain available


Edit the configuration file of the Zimlet 


After that you have installed the zimlet SiFLOW, access to the server where it has been installed and go in the directory where it is contained  :

/opt/zimbra/zimlets-deployed/it_seacom_processmaker

open the file config_template.xml and modify the contentof the propriety allowedDomains, by inserting the domain of your company.



Create symbolic links to the zimbra's library


To do this,  access at the server where you have installed the Zimlets and just run in the terminal the following commands to create symbolic links:

ln -s /opt/zimbra/jetty/webapps/service/WEB-INF/lib/zimbrastore.jar /opt/zimbra/jetty/webapps/zimlet/WEB-INF/lib/

ln -s /opt/zimbra/jetty/webapps/service/WEB-INF/lib/zimbrasoap.jar /opt/zimbra/jetty/webapps/zimlet/WEB-INF/lib/

ln -s /opt/zimbra/jetty/webapps/service/WEB-INF/lib/zimbraclient.jar /opt/zimbra/jetty/webapps/zimlet/WEB-INF/lib/


First Use
============
Before you can use SiFLOW, access to the settings in the zimlet panel and set:
The URL of ProcessMaker → ( e.s : processmaker.seacom.it ), username and password, workspace.
Press OK, and after you can restart Zimbra.

ATTENTION: the protocol of your Zimbra must be the same of your ProcessMaker. So, if to enter in Zimbra you use http, so also processmaker have to use http. The same is for https.
Plus, is need to have a valid certificate for don't have problem of viewing of the PM Tab

Reminder settings
============
In the zimlet panel, is possible set time that you needs to be done for control on the presence of unassigned cases. 


How to set up a process to interact with the Zimlet Siflow
============

The Zimlets Siflow defines some cases variables that represent the fields of a mail message. When you use an e-mail (through drug n drop on Zimlets or via the context menu) to start a process, the Zimlets sends this information to the process. If in the process, there are cases variables with the same name as the old ones from Zimlets, they will be automatically completed with the information contained in it. 

In the list below are listed all the cases variables defined in Zimlets: 

zpmIsSentEmail (Indicates if the email is sent or rereived),
zpmToData (The TO field of the email),
zpmSentDateEmail  (The sent date),
zpmCcData  (The CC field of the email),
zpmBccData  (The BCC field of the email), 
zpmSubject  (The Subject field of the email), 
zpmFromName  (The FROM-Name of field of the email),
zpmFromEmail  (The FROM-Email of field of the email),
zpmBody  (The Body field content of the email),
The zpmAttachData  (attachments),
pmServerUrl  (The ProcessMaker hostname),

For examples of configuration process, I implemented the process "SiFlow_process" with .pm extension.
