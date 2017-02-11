(function() {
    Stevenson.ext.showJSONDoc = function(studyContent, callShowJSON){
        var doc = document, win = window,
            $ = function(id) { return doc.getElementById(id); },
            $$ = function(sel) { return doc.getElementsByTagName(sel); },
            $each = function(fn) { for (var i=0,len=this.length; i<len; i++) fn(i, this[i], this); };

        $.each = function(arr, fn) { $each.call(arr, fn); };

        var splitCase = function (t) { return typeof t != 'string' ? t : titleCase(t.replace(/([a-z0-9])([A-Z])/g, '$1 $2')); },
            titleCase = function (s) { return s.replace(/\w\S*/g, function (t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); },
            uniqueKeys = function(m){ var h={}; for (var i=0,len=m.length; i<len; i++) for (var k in m[i]) if (show(k)) h[k] = k; return h; },
            keys = function(o){ var a=[]; for (var k in o) if (show(k)) a.push(k); return a; };
        var tbls = [];

        function val(m) {
          if (m == null) return '';
          if (typeof m == 'number') return num(m);
          if (typeof m == 'string') return str(m);
          if (typeof m == 'boolean') return m ? 'true' : 'false';
          return m.length ? arr(m) : obj(m);
        };
        function num(m) { return m; };
        var sdfmt = location.hash.indexOf('show=') >=0 && location.hash.indexOf('fulldates') >= 0 ? dmft : dmfthm;
        function str(m){ return m.substr(0,6) == '/Date(' ? sdfmt(date(m)) : m.substr(0,4) == 'http' ? shref(m) : m; };
        function sfmt(s) { return humanize ? splitCase(s) : s; };
        function shref(s) { return humanize ? '<a href="' + s + '">' + s + '</a>' : s; };
        function date(s) { return new Date(parseFloat(/Date\(([^)]+)\)/.exec(s)[1])); };
        function pad(d) { return d < 10 ? '0'+d : d; };
        function dmft(d) { return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()); };
        function dmfthm(d) { return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
        function show(k) { return typeof k != 'string' || k.substr(0,2) != '__'; };
        function obj(m) {
          var sb = '<dl>';
          for (var k in m) if (show(k)) sb += '<dt class="ib">' + sfmt(k) + '</dt><dd>' + val(m[k]) + '</dd>';
          sb += '</dl>';
          return sb;
        };
        function arr(m) {
          if (typeof m[0] == 'string' || typeof m[0] == 'number') return m.join(', ');
          var id=tbls.length, h=uniqueKeys(m);
          var sb = '<table id="tbl-' + id + '"><caption></caption><thead><tr>';
          tbls.push(m);
          var i=0;
          for (var k in h) sb += '<th id="h-' + id + '-' + (i++) + '"><b></b>' + sfmt(k) + '</th>';
          sb += '</tr></thead><tbody>' + makeRows(h,m) + '</tbody></table>';
          return sb;
        };

        function makeRows(h,m) {
          var sb = '';
          for (var r=0,len=m.length; r<len; r++) {
            sb += '<tr>';
            var row = m[r];
            for (var k in h) if (show(k)) sb += '<td>' + val(row[k]) + '</td>';
            sb += '</tr>';
          }  
          return sb;
        };
        
        var model = studyContent,
            txt = $$('TEXTAREA')[0],
            humanize = true && location.hash.indexOf('dehumanize') == -1,
            isIE = /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent);

        if (callShowJSON === true) {
            showJson();
            return;
        } else {
            $("content").innerHTML = val(model);  
            txt.innerHTML=JSON.stringify(model);
        }

        function showJson(){ doc.body.className='show-json'; txt.select(); txt.focus(); };

        doc.onclick = function(e) {
            e = e || window.event, el = e.target || e.srcElement, cls = el.className;
            if (el.tagName == 'B') el = el.parentNode;
            if (el.tagName != 'TH') return;
            el.className = cls == 'asc' ? 'desc' : (cls == 'desc' ? null : 'asc');
            $.each($$('TH'), function(i,th){ if (th == el) return; th.className = null; });
            clearSel();
            var ids=el.id.split('-'), tId=ids[1], cId=ids[2];
            if (!tbls[tId]) return;
            var tbl=tbls[tId].slice(0), h=uniqueKeys(tbl), col=keys(h)[cId], tbody=el.parentNode.parentNode.nextSibling;
            if (!el.className){ setTableBody(tbody, makeRows(h,tbls[tId])); return; }
            var d=el.className=='asc'?1:-1;
            tbl.sort(function(a,b){ return cmp(a[col],b[col]) * d; });
            setTableBody(tbody, makeRows(h,tbl));
        };

        function setTableBody(tbody, html) {
          if (!isIE) { tbody.innerHTML = html; return; }
          var temp = tbody.ownerDocument.createElement('div');
          temp.innerHTML = '<table>' + html + '</table>';
          tbody.parentNode.replaceChild(temp.firstChild.firstChild, tbody);
        };

        function clearSel() {
          if (doc.selection && doc.selection.empty) doc.selection.empty();
          else if(win.getSelection) {
            var sel=win.getSelection();
            if (sel && sel.removeAllRanges) sel.removeAllRanges();
          }
        };

        function cmp(v1, v2){
          var f1, f2, f1=parseFloat(v1), f2=parseFloat(v2);
          if (!isNaN(f1) && !isNaN(f2)) v1=f1, v2=f2;
          if (typeof v1 == 'string' && v1.substr(0,6) == '/Date(') v1=date(v1), v2=date(v2);
          if (v1 == v2) return 0;
          return v1 > v2 ? 1 : -1;
        };
    };
	var loadStudyForPosting = function(path){
		Stevenson.ui.Loader.display('Loading study ' +  path + ' for posting...', 500);
        Stevenson.log.info('Loading study ' +  path + ' for posting...');
        
        $.ajax({
            url: path,
            success: function (data){
                  var parts = data.split('---');
                if(parts.length == 3){
                    Stevenson.studyContent = parts[2];
                    Stevenson.ui.Loader.hide();
                    Stevenson.log.info('Study file: ' +  path + ' read.');
                    Stevenson.ext.showJSONDoc(JSON.parse(Stevenson.studyContent), false);
                    
               } else {
                    Stevenson.studyContent = parts[0];
                    Stevenson.log.warn('No YAML header found on study file');
                }
           },
            error: function (message){
						Stevenson.ui.Loader.hide();
						Stevenson.ui.Messages.displayError('Unable to load study file: ' + path + message);
					}
        });
        
 	};
    
	Stevenson.ext.beforeInit(function() {
		
		Stevenson.log.info('Initializing study file: ' + Stevenson.studyURL + ' for posting');
		loadStudyForPosting(Stevenson.studyURL);
        
        
	});
})(jQuery);

