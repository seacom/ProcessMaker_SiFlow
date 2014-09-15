AjxTemplate.register("com_processmaker_zimbra.template.overview#folderGroup", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<div class=\"overviewHeader\"><table cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"width:16pxheight:16px\" align=\"center\"><div class=\"ImgNodeExpanded\" id=\"";
	buffer[_i++] = data["headerId"];
	buffer[_i++] = "\"></div></td><td class=\"imageCell\"></td><td class=\"overviewHeader-Text\">";
	buffer[_i++] = data["name"];
	buffer[_i++] = "</td><td style=\"width:16pxheight:16px\">";
	buffer[_i++] =  AjxImg.getImageHtml("Blank_16") ;
	buffer[_i++] = "</td></tr></tbody></table></div><div class=\"containerGroup\">";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderGroup"
}, true);
AjxPackage.define("com_processmaker_zimbra.template.overview");
AjxTemplate.register("com_processmaker_zimbra.template.overview", AjxTemplate.getTemplate("com_processmaker_zimbra.template.overview#folderGroup"), AjxTemplate.getParams("com_processmaker_zimbra.template.overview#folderGroup"));

AjxTemplate.register("com_processmaker_zimbra.template.overview#folderItemOpen", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<div class=\"DwtComposite\"><div class=\"DwtTreeItem\" id=\"";
	buffer[_i++] = data["id"];
	buffer[_i++] = "\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr>";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderItemOpen"
}, true);

AjxTemplate.register("com_processmaker_zimbra.template.overview#folderItemLevel", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<td style=\"width:16px;height:16px\" align=\"center\">";
	buffer[_i++] =  AjxImg.getImageHtml("Blank_16") ;
	buffer[_i++] = "</td>";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderItemLevel"
}, true);

AjxTemplate.register("com_processmaker_zimbra.template.overview#folderItemCollapsable", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<td style=\"width:16px;height:16px\" align=\"center\"><div class=\"ImgNodeExpanded\" id=\"";
	buffer[_i++] = data["id"];
	buffer[_i++] = "\"></div></td>";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderItemCollapsable"
}, true);

AjxTemplate.register("com_processmaker_zimbra.template.overview#folderItemIcon", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<td style=\"width:16px;height:16px;padding-right:5px\"><div class=\"";
	buffer[_i++] = data["icon"];
	buffer[_i++] = "\"></div></td>";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderItemIcon"
}, true);

AjxTemplate.register("com_processmaker_zimbra.template.overview#folderItemClose", 
function(name, params, data, buffer) {
	var _hasBuffer = Boolean(buffer);
	data = (typeof data == "string" ? { id: data } : data) || {};
	buffer = buffer || [];
	var _i = buffer.length;

	buffer[_i++] = "<td class=\"DwtTreeItem-Text\" nowrap=\"nowrap\">\n";
	buffer[_i++] = "\t\t\t\t\t\t\t";
	buffer[_i++] = data["name"];
	buffer[_i++] = "\n";
	buffer[_i++] = "\t\t\t\t\t\t</td><td style=\"width:16px;height:16px;padding-right:5px\">";
	buffer[_i++] =  AjxImg.getImageHtml("Blank_16") ;
	buffer[_i++] = "</td></tr></tbody></table></div></div>";

	return _hasBuffer ? buffer.length : buffer.join("");
},
{
	"id": "folderItemClose"
}, true);

