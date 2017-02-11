---
---
(function($) {
	var editorConfig = null;
	var currentPage = null;
	var loadEditor = function(properties){
		if(properties){
			
			var layout = properties.layout;
			if(!layout || layout == '') {
				layout = 'default';
			}
			
			var schema = properties.schema;
			if(!schema || schema == '') {
				schema = 'cohortexV1.0.0';
			} else {
				properties.layout = layout;
			}
			
			Stevenson.repo.getEditorConfig({
				layout: properties.layout,
				schema: properties.schema,
				success: function(config){
					editorConfig = config;
					Stevenson.ui.Editor.load(editorConfig, properties);
					Stevenson.ui.ContentEditor.configure(editorConfig);
					Stevenson.ui.Loader.hide();
				},
				error:  function(message){
					Stevenson.ui.ContentEditor.configure({});
					Stevenson.ui.Loader.hide();
					Stevenson.ui.Messages.displayError('Exception loading properties editor: '
							+ message+', if you haven\'t already, <a href="'{{ site.baseurl }}/cms/edit.html?new=true#' + Stevenson.Account.siteBaseURL + '/' + Stevenson.Account.schemasPath + schema + '.json">configure the schema for this configuration</a>.');
				},
				configSchema: function(config){
					editorConfig = config;
					Stevenson.ui.ContentEditor.configure(editorConfig);
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

		$.each(Stevenson.repo.layouts, function(index, elem){
			$('#layout').append('<option>' + elem + '</option>');
		});
			
		$.each(Stevenson.repo.schemas, function(index, elem){
			$('#schema').append('<option>' + elem + '</option>');
		});
	
		if (Stevenson.Account.repo == '') {
			Stevenson.log.warn('Website repository not set');
			Stevenson.ui.Messages.displayError('Website repository not set.  <a href="{{ site.baseurl }}/cms">Configure</a>');
		}
		
		var pagePath = window.location.hash.substr(1);
		$('#page-path').val(pagePath);
		if (Stevenson.util.getParameter('new') == 'true') {
			Stevenson.log.info('Creating new page');
			currentPage = new Page(pagePath, '');
			Stevenson.ui.ContentEditor.setContent(currentPage);

			$('#layout').change(function(){
				$('.properties .fields').html('');
				if(typeof properties == "undefined"){
					properties = {};
				}
				properties.layout = $('#layout').val();
				loadEditor(properties);
			});
			
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
						$('#layout').val(properties.layout);
						$('#schema').val(properties.schema);
					}
					
					loadEditor(properties);
					
					$('#layout').change(function(){
						$('.properties .fields').html('');
						if(typeof properties === "undefined"){
							properties = {};
						}
						properties.layout = $('#layout').val();
						loadEditor(properties);
					});
					
					$('#schema').change(function(){
						$('.properties .fields').html('');
						if(typeof properties === "undefined"){
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
					window.location.replace('{{ site.baseurl }}/cms/edit.html#'+newPath);
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
			
			var layout = $('#layout').val();
			var schema = $('#schema').val();
			var title = $('#title').val();
			if(properties) {
				properties.layout = layout;
				properties.schema = schema;
				if(!Stevenson.ui.Editor.save(editorConfig, properties)){
					Stevenson.log.info('Unable to save changes due to validation errors');
					Stevenson.ui.Loader.hide();
					return false;
				}
			} else {
				if(layout != ''){
					properties = {};
					properties.layout = layout;
					Stevenson.ui.Editor.save(editorConfig, properties);
				}

				if(schema != ''){
					properties = {};
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
						window.location.replace('{{ site.baseurl }}/cms/edit.html#'+currentPage.path);
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
