/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.4.2 (2020-08-17)
 */
(function () {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var setContent = function (editor, html) {
      editor.focus();
      editor.undoManager.transact(function () {
        editor.setContent(html);
      });
      editor.selection.setCursorLocation();
      editor.nodeChanged();
    };

    var getContent = function (editor) {
      return editor.getContent({ source_view: true });
    };

    var open = function (editor, api) {
      var editorContent = getContent(editor);
      let element = document.getElementById('tinymce_codeEditor');
      if(element && element.style.display === 'none'){
          element.value = editorContent;
          element.style.display = 'block';
          editor.setContent('');
          let buttonsAPI = editor.ui.registry.getAll().buttonsApi;
          for(let attr in buttonsAPI){
              if(buttonsAPI[attr] && attr !== 'sourcecode')
                  buttonsAPI[attr].setDisabled(true);
          }
          if(api)
              api.setActive(true);
      }else{
          let codeContent = element.value;
          editor.setContent(codeContent);
          element.style.display = 'none';
          let buttonsAPI = editor.ui.registry.getAll().buttonsApi;
          for(let attr in buttonsAPI){
              if(buttonsAPI[attr] && attr !== 'sourcecode')
                  buttonsAPI[attr].setDisabled(false);
          }
          if(api)
              api.setActive(false);

      }
    };

    var register = function (editor) {
      editor.addCommand('mceCodeEditor', function () {
        open(editor);
      });
    };

    var register$1 = function (editor) {
      editor.ui.registry.addToggleButton('code', {
          icon: 'sourcecode',
          tooltip: 'Source code',
          onAction: function (api) {
              open(editor,api);
        }
      });

      editor.ui.registry.addMenuItem('code', {
        icon: 'sourcecode',
        text: 'Source code',
        onAction: function (api) {
          return open(editor,api);
        }
      });
    };

    function Plugin () {
      global.add('code', function (editor) {
        register(editor);
        register$1(editor);
        return {};
      });
    }

    Plugin();

}());
