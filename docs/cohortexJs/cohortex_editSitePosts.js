(function($) {
	function bytesToSize(bytes) {
		var k = 1000;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return '0 Bytes';
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)),10);
		return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
	}
	var loadFiles = function(path){
		var chkbxRun=false;
		Stevenson.ui.Loader.display('Loading files...', 100);
		$('#grid-container').html('');
		$('#grid-container').mustache('grid', {});
		Stevenson.repo.getFiles({
			path: path,
			success: function(files){
				window.location.hash = path;
				$('#files').attr('data-path', path);
				$('.breadcrumb .path').html(path);
				$('#files tbody').html('');
				$.each(files, function(index, file){
					//CohortExDev - Show all files - no folder-close
					if(file.path.indexOf('_config') != 0 && file.path.indexOf('_layouts') != 0 && file.path.indexOf('_editors') != 0 && file.path.indexOf('_schemas') != 0 && file.type != 'folder-close'){
						file.size = file.size ? bytesToSize(file.size) : '';
						$('#files tbody').mustache('file', file);
						}
				});
				$('#files input[type=checkbox]').each(function(index, item){
						$(item).removeAttr('checked');
					});
				
				$('.folder-close').click(function(){
					window.location.hash = $(this).attr('data-path');
				});
				$('#files .file').click(function(){
					var checked = '';
					
					if (chkbxRun == true){
						chkbxRun = false;
						return;
					}
					
					$(this).find('input[type=checkbox]').each(function(idx, elem){
						checked = $(elem).attr('checked');
					})
					$('#files input[type=checkbox]').each(function(index, item){
						$(item).removeAttr('checked');
					});
					$(this).find('input[type=checkbox]').each(function(idx, elem){
						if (checked != 'checked') {
							$(elem).attr('checked','checked');
						}
					})
				});
				$('#files input[type=checkbox]').click(function(){
					var checked = this;
					chkbxRun = true;
					
					$('#files input[type=checkbox]').each(function(index, item){
						if(item != checked){
							$(item).removeAttr('checked');
						}
					});
				});
				$('#files').dataTable();
				Stevenson.ui.Loader.hide();
				
			},
			error: function(message){
				Stevenson.ui.Loader.hide();
				Stevenson.ui.Messages.displayError('Unable to load branches: ' + message);
			}
		});
	};
	Stevenson.ext.afterInit(function() {
		Stevenson.log.info('Initializing files');
		
		$('.breadcrumb .repo').html(Stevenson.Account.repo);
		
		var path = window.location.hash;
		if(path != ''){
			path = path.substr(1);
		}
		$('.breadcrumb .path').html(path);
		loadFiles(path);
		
	});
	$(document).ready(function(){
		
		/*
		 * Listen for the hash to change
		 */
		window.addEventListener("hashchange", function(){
			var path = window.location.hash;
			if(path != ''){
				path = path.substr(1);
			}
			loadFiles(path);
		}, false);
		
		/**
		 * Support creating new files
		 */
		$('.main-menu .new').click(function(){
			$('body').mustache('new-file', {});
			$('#new-file-modal').modal({
				show: true
			});
			$('#new-file-modal .no').click(function() {
				$('#new-file-modal').modal('hide').remove();
			});
			$('form#new-file').submit(function() {
				$('#new-file-modal .modal-body .alert-error').remove();
				var name = $('#file-name').val();
				if(name != ''){
					//Change whitespaces in name with -
					name = name.replace(/\s/g, "-");
					
					var today = new Date();
					var dd = today.getDate();

					var mm = today.getMonth()+1; 
					var yyyy = today.getFullYear();
					if(dd<10) 
					{
						dd='0'+dd;
					} 

					if(mm<10) 
					{
						mm='0'+mm;
					} 
					var todayStr = yyyy+'-'+mm+'-'+dd+'-';
					
					var newName = todayStr + name + '.md';
					
					var path = $('#files').attr('data-path');
					var filePath = path + "/" + newName;
					if(path == ""){
						filePath = newName;
					}
					$('#new-file-modal .btn, #new-file-modal input').attr('disabled','disabled');
					Stevenson.repo.savePage({
						fileName: newName,
						path: filePath,
						page: {
							content:'--- \n' +
									'layout: stevPost \n' + 
									'title: \'Write a title here..\' \n' +
									'date: ' + todayStr + '\n' +
									'published: false \n' +
									'authRequired: false \n' +
									'---\n'
						},
						message: 'Creating new post: ' + newName,
						success: function(){
								window.location = Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_editPost.html#'+this.path;	
						},
						error: function(msg){
							$('#new-file-modal .btn, #new-file-modal input').removeAttr('disabled');
							$('#new-file-name').addClass('error');
							$('#new-file-modal .modal-body').prepend('<div class="alert alert-error">Error creating page: '+msg+'.</div>');
						}
					});
				} else {
					$('#new-file-name').addClass('error');
					$('#file-name-modal .modal-body').prepend('<div class="alert alert-error">Please enter a file name.</div>');
				}
				return false;
			});
		});
		
		/**
		 * Support editing files
		 */
		$('.file-edit').click(function(){
			Stevenson.ui.Loader.display('Loading editor...', 100);
			var path = $('#files input[type=checkbox]:checked').parents('tr').attr('data-path');
			// CohortExDev If it is .jctx, it is a study
			if (typeof path !== 'undefined' && path != '') {
				window.location = Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_editPost.html#' + path;
			} else {
					Stevenson.ui.Messages.displayError("No file selected. Please, select a file to edit.");
					Stevenson.ui.Loader.hide();
			}
			return false;
		});
		
		/**
		 * Support deleting files
		 */
		$('.file-delete').click(function(){
			$('#delete-file-modal').modal({
				show: true
			});
			var path = $('#files input[type=checkbox]:checked').parents('tr').attr('data-path');
			$('#delete-file-modal .yes').click(function(){
				$('#delete-file-modal').modal('hide');
				Stevenson.ui.Loader.display('Deleting...', 100);
				Stevenson.repo.deleteFile({
					path: path,
					success: function(path){
						Stevenson.ui.Messages.displayMessage("Deleted file: " + path);
						Stevenson.ui.Loader.hide();
						var path = window.location.hash;
						if(path != ''){
							path = path.substr(1);
						}
						loadFiles(path);
						
					},
					error: function(message){
						Stevenson.ui.Messages.displayError("Failed to delete file: "+path+" due to error "+message);
						Stevenson.ui.Loader.hide();
					}
				});
				return false;
			});
			$('#delete-file-modal .no').click(function(){
				$('#loading-modal').modal('hide');
				return false;
			});
		});
		
		/**
		 * Support moving files
		 */
		$('.file-move').click(function(){
			var path = $('#files input[type=checkbox]:checked').parents('tr').attr('data-path');
			$('#move-modal input').val(path);
			$('#move-modal').modal({
				show: true
			});
		});
		$('#move-modal .no').click(function(){
			$('#move-modal').modal('hide');
			return false;
		});
		$('#move-modal .yes').click(function(){
			$('#move-modal').modal('hide');
			Stevenson.ui.Loader.display('Moving file...', 100);
			var oldPath = $('#move-modal #old-path').val();
			var newPath = $('#move-modal #new-path').val();
			Stevenson.repo.moveFile({
				oldPath: oldPath,
				newPath: newPath,
				success: function(path){
					Stevenson.ui.Messages.displayMessage("Moved file: "+oldPath +' to '+newPath);
					Stevenson.ui.Loader.hide();
					var path = window.location.hash;
					if(path != ''){
						path = path.substr(1);
					}
					loadFiles(path);
				},
				error: function(message){
					Stevenson.ui.Messages.displayError("Failed to move file from '"+oldPath+"' to '"+newPath+"' due to error "+message);
					Stevenson.ui.Loader.hide();
				}
			});
			return false;
		});
		

		/**
		 * Support copying files
		 */
		$('.file-copy').click(function(){
			var path = $('#files input[type=checkbox]:checked').parents('tr').attr('data-path');
			$('#copy-modal input').val(path);
			$('#copy-modal').modal({
				show: true
			});
		});
		$('#copy-modal .no').click(function(){
			$('#copy-modal').modal('hide');
			return false;
		});
		$('#copy-modal .yes').click(function(){
			$('#copy-modal').modal('hide');
			Stevenson.ui.Loader.display('Copying file...', 100);
			var oldPath = $('#copy-modal #old-path').val();
			var newPath = $('#copy-modal #new-path').val();
			Stevenson.repo.copyFile({
				oldPath: oldPath,
				newPath: newPath,
				success: function(path){
					Stevenson.ui.Messages.displayMessage("Copied file: "+oldPath +' to '+newPath);
					Stevenson.ui.Loader.hide();
					var path = window.location.hash;
					if(path != ''){
						path = path.substr(1);
					}
					loadFiles(path);
				},
				error: function(message){
					Stevenson.ui.Messages.displayError("Failed to copy file from '"+oldPath+"' to '"+newPath+"' due to error "+message);
					Stevenson.ui.Loader.hide();
				}
			});
			return false;
		});
		
		/**
		 * Support File Uploads
		 */
		$('.main-menu .file-upload').click(function(){
			$('#upload-modal').remove();
			var path = $('#files').attr('data-path');
			
			$('body').mustache('upload', {
				path: path
			});
			
			
			$('#upload-modal .no').click(function() {
				$('#upload-modal').modal('hide').remove();
			});
			$('#upload-modal form').submit(function(){
				$('#upload-modal').modal('hide');
				Stevenson.ui.Loader.display('Uploading file...', 100);
			
				var reader = new FileReader();
				reader.onload = function(e) {
					var name = $('#upload-modal input[name=file]').val().split(/(\\|\/)/g).pop();
					var page = new Page($('#upload-modal input[name=path]').val()+'/'+name, reader.result);
					Stevenson.repo.savePage({
						page: page,
						path: page.path,
						message: "Adding file: "+name,
						success: function(){
							Stevenson.ui.Messages.displayMessage("Successfully uploaded file "+name);
							Stevenson.ui.Loader.hide();
							loadFiles($('#files').attr('data-path'));
						},
						error: function(message){
							Stevenson.ui.Messages.displayError("Failed to upload file "+name+" due to exception: "+message);
							Stevenson.ui.Loader.hide();
						}
						
					});
				}
				reader.readAsArrayBuffer(document.getElementById('upload-file-input').files[0]);	
				return false;
			});
			$('#upload-modal').modal({
				show: true
			});
			return false;
		});
		
		
		/**
		 * Support viewing a file's history
		 */
		$('.main-menu .view-history').click(function(){
			Stevenson.ui.Loader.display('Loading file history...', 100);
			var path = $('#files input[type=checkbox]:checked').parents('tr').attr('data-path');
			if(!path){
				path = "";
			}
			Stevenson.repo.getHistory({
				path: path,
				success: function(commits){
					Stevenson.ui.Messages.displayMessage("Loaded history of file: /" + path);
					Stevenson.ui.Loader.hide();
					$('body').mustache('history', {
						file: "/" + path
					});
					$.each(commits, function(idx, commit) {
						$('#history-modal .history-container').mustache('history-item', commit);
					});
					$('#history-modal').modal({
						show: true
					});
					$('#history-modal .no').click(function() {
						$('#history-modal').modal('hide').remove();
					});
				},
				error: function(message){
					Stevenson.ui.Messages.displayError("Failed to get history of file '" + path + "' due to error "+message);
					Stevenson.ui.Loader.hide();
				}
			});
		});
	});
})(jQuery);
