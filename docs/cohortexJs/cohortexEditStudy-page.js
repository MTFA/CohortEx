(function($) {
	var editorConfig = null;
	var currentPage = null;
	var loadEditor = function(properties){
		if(properties){
			
			var schema = properties.schema;
			
			if(!schema || schema == '') {
				schema = 'cohortexV1.0.0';
			}
			
			properties.layout = 'cohortexStudy';
			
			Stevenson.repo.getEditorConfig({
				schema: properties.schema,
				layout: properties.layout,
				success: function(config){
					//CohortExDev: editorConfig is used in save function
					editorConfig = config;
					Stevenson.ui.Editor.load(editorConfig, properties);
					//JSONeditor does not use these configuration (fields), 
					//but we do not have another abstract method
					Stevenson.ui.ContentEditor.configure(editorConfig);
					Stevenson.ui.Loader.hide();
				},
				error:  function(message){
					Stevenson.ui.ContentEditor.configure({});
					Stevenson.ui.Loader.hide();
					Stevenson.ui.Messages.displayError('Exception loading properties editor: '
							+ message+', if you haven\'t already, <a href="' + Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_editStudy.html?new=true#' + Stevenson.Account.siteBaseURL + '/' + Stevenson.Account.schemasPath + schema + '.json">configure the schema for this study</a>.');
				},
				configSchema: function(config){
					//CohortExDev: load the schema into editor. Do not destroy editorConfig, we need it for save function
					Stevenson.ui.ContentEditor.configure(config);
					Stevenson.ui.Loader.hide();
				}
			});
		} else {
			Stevenson.ui.ContentEditor.configure({});
			Stevenson.ui.Loader.hide();
		}
	};
	var initialize = function() {
		Stevenson.log.info('Editing page');

		$.each(Stevenson.repo.schemas, function(index, elem){
			$('#schema').append('<option>' + elem + '</option>');
		});
	
		if (Stevenson.Account.repo == '') {
			Stevenson.log.warn('Website repository not set');
			Stevenson.ui.Messages.displayError('Website repository not set.  <a href="' + Stevenson.Account.siteBaseURL + '/cohortexCms">Configure</a>');
		}
		
		var pagePath = window.location.hash.substr(1);
		$('#page-path').val(pagePath);
		if (Stevenson.util.getParameter('new') == 'true') {
			Stevenson.log.info('Creating new page');
			currentPage = new Page(pagePath, '');
			Stevenson.ui.ContentEditor.setContent(currentPage);

			$('#schema').change(function(){
				$('.properties .fields').html('');
				if(typeof properties === "undefined"){
					properties = {};
				}
				properties.schema = $('#schema').val();
				loadEditor(properties);
			});
			
		} else {
			Stevenson.ui.Loader.display('Loading page...', 100);
			Stevenson.log.info('Updating existing page');
			Stevenson.repo.getFile({
				path: pagePath,
				success: function(file){
					Stevenson.log.debug('Retrieved page: ' + file.path);
					currentPage = file;
					
					Stevenson.log.debug('Setting content');
					Stevenson.ui.ContentEditor.setContent(file);
					
					Stevenson.log.debug('Loading properties editor');
					var properties = file.getProperties();
					if(properties) {
						$('#schema').val(properties.schema);
					}
					
					loadEditor(properties);
										
					$('#schema').change(function(){
						$('.properties .fields').html('');
						if(typeof properties == "undefined"){
							properties = {};
						}
						properties.schema = $('#schema').val();
						loadEditor(properties);
					});
				},
				error: function(message){
					Stevenson.ui.Loader.hide();
					Stevenson.ui.Messages.displayError('Exception loading page: '
							+ message);
				}
			});
		}
	};
	Stevenson.ext.afterInit(initialize);
	$(document).ready(function(){
		$('#rename-page').submit(function(){
			Stevenson.ui.Loader.display('Renaming page...',100);
			var oldPath = window.location.hash.substr(1);
			var newPath = $('#page-path').val()
			Stevenson.repo.moveFile({
				oldPath: oldPath,
				newPath: newPath,
				success: function(path){
					window.location.replace(Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_editStudy.html#'+newPath);
					initialize();
					Stevenson.ui.Messages.displayMessage("Moved file: " + oldPath +' to ' + newPath);
					Stevenson.ui.Loader.hide();
				},
				error: function(message){
					Stevenson.ui.Messages.displayError("Failed to move file from '"+oldPath+"' to '"+newPath+"' due to error "+message);
					Stevenson.ui.Loader.hide();
				}
			});
			return false;
		});
	
		$('.save').click(function(){
			
			window.scrollTo(0,0);
			Stevenson.ui.Loader.display('Saving page...', 100);
			
			var properties = currentPage.getProperties();
			
			var schema = $('#schema').val();
			var title = $('#title').val();
			
			if (schema == ''){
				schema = 'cohortexV1.0.0';
			}
			
			if(properties) {
				properties.layout = 'cohortexStudy';
				properties.schema = schema;
				if(!Stevenson.ui.Editor.save(editorConfig, properties)){
					Stevenson.log.info('Unable to save changes due to validation errors');
					Stevenson.ui.Loader.hide();
					return false;
				}
			} else {

				if(schema != ''){
					properties = {};
					properties.layout = 'cohortexStudy';
					properties.schema = schema;
					Stevenson.ui.Editor.save(editorConfig, properties);
				}
			}
			
			var pageContent = Stevenson.ui.ContentEditor.getContent(currentPage);
			if(properties){
				Stevenson.log.debug('Adding Jekyll header');
				
				/* Jekyll Header files need to only be ASCII */
				if(!(/^[\000-\177]*$/.test(pageContent)) && currentPage.getType() !== 'jctx') {
					var c = '';
					for (var i = 0; i < pageContent.length; i++) {
						if (pageContent.charCodeAt(i) > 127) {
							c = pageContent.charAt(i);
							break;
						}
					}
					Stevenson.ui.Messages.displayError('Exception saving page, invalid non-ASCII character: '+c);
					Stevenson.ui.Loader.hide();
					return false;
    			}
				
				var header = '---\n';
				header += YAML.stringify(properties);
				header += '---\n\n';
				currentPage.content = header + pageContent;
			} else {
				Stevenson.log.debug('Not adding Jekyll header');
				currentPage.content = pageContent;
			}

			var message = $('#message').val();
			if(message == ''){
				message = 'Updating '+window.location.hash.substr(1);
			}
			Stevenson.repo.savePage({
				page: currentPage,
				path: window.location.hash.substr(1),
				message: message,
				error: function(message){
					Stevenson.ui.Loader.hide();
					Stevenson.ui.Messages.displayError('Exception saving page: '
						+ message);
				},
				success: function(){
					Stevenson.ui.Messages.displayMessage('Page saved successfully!');
					Stevenson.ui.Loader.hide();
					if (Stevenson.util.getParameter('new') == 'true') {
						window.location.replace(Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_editStudy.html#'+currentPage.path);
					} else {
						$('#message').val('');
						initialize();
					}
				}
			});
			return false;
		});
	});
})(jQuery);
