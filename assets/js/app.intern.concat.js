angular.module('jumplink.cms.admin', [
    'sails.io',
  ])

  .directive('adminbar', function ($compile, $window, $sailsSocket, $state) {

    return {
      restrict: 'E',
      templateUrl: '/views/modern/adminbar.jade',
      scope: {
        download : "=?",
        toogleHtml: "=?",
        refresh: "=?",
        save: "=?",
        add: "=?",
        addDropdown: "=?",
        addDropdownActions: "=?",
        adminSettingDropdown: "=?",
        authenticated: "=?",
        allowActions: "=?",
      },
      link: function ($scope, $element, $attrs) {

        $scope.goToState = $state.go;

        if(angular.isUndefined($scope.adminSettingDropdown)) {
          $scope.adminSettingDropdown = [
            {
              "text": "<i class=\"fa fa-list\"></i>&nbsp;Übersicht",
              "click": "goToState('layout.administration')"
            },
            {
              "text": "<i class=\"fa fa-users\"></i>&nbsp;Benutzer",
              "click": "goToState('layout.users')"
            },
            {
              "text": "<i class=\"fa fa-sign-out\"></i>&nbsp;Abmelden",
              "click": "$root.logout()"
            }
          ];
        }
      }
    };
  })

;
angular.module('ngAsync', [])
.service('$async', function () {
  // https://github.com/caolan/async/issues/374#issuecomment-27498818
  async.objectMap = function ( obj, func, cb ) {
    var i, arr = [], keys = Object.keys( obj );
    for ( i = 0; i < keys.length; i += 1 ) {
      var wrapper = {};
      wrapper[keys[i]] = obj[keys[i]];
      arr[i] = wrapper;
    }
    this.map( arr, func, function( err, data ) {
      if ( err ) { return cb( err ); }
      var res = {};
      for ( i = 0; i < data.length; i += 1 ) {
          res[keys[i]] = data[i];
      }
      return cb( err, res );
    });
  };
  return async;
});
angular.module('jumplink.cms.bootstrap.attachment', [
  'jumplink.cms.attachment',
])
.directive('jlAttachmentBootstrap', function ($compile, $window, mediumOptions, AttachmentService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/attachment.bootstrap.jade',
    scope: {
      attachment: "=",
      attachmentIndex: "=",
      parent: "=",
      path: "=",
      authenticated: "=",
      destroy: "=",
      centerImage: "="
    },
    link: function ($scope, $element, $attrs) {
      console.log("[jlAttachmentBootstrap.link]", $scope);
    },
    controller: function ($scope, AttachmentService) {
      $scope.open = AttachmentService.open;
    }
  };
});
angular.module('jumplink.cms.attachment', [
  'sails.io',
])

.service('AttachmentService', function (moment, $sailsSocket, $async, $log, $window) {

  var open = function (url, target) {
    $window.open(url, target);
  };

  /**
   * delete attachment on local / client / browser
   */
  var destroyLocally = function (blogPosts, postIndex, attachmentIndex, cb) {
    if(blogPosts[postIndex].attachments.length > 0) {
      blogPosts[postIndex].attachments.splice(attachmentIndex, 1);
    }
    return cb(null, blogPosts, postIndex, attachmentIndex);
  };

  /**
   * delete attachment extern / server
   */
  var destroyExternally = function (blogPosts, postIndex, attachmentIndex, cb) {
    $sailsSocket.put('/blog/destroyAttachment', {blogPostID: blogPosts[postIndex].id, attachmentUploadedAs: blogPosts[postIndex].attachments[attachmentIndex].uploadedAs})
    .success(function (data, status, headers, config) {
      $log.debug(null, data, status, headers, config);
      cb();
    })
    .error(function (data, status, headers, config) {
      $log.error(data, status, headers, config);
      cb("error", data, status, headers, config);
    });
  };

  var destroy = function (blogPosts, post, attachmentIndex, cb) {
    var postIndex = blogPosts.indexOf(post);
    $log.debug("[BlogService.destroy]", blogPosts[postIndex], attachmentIndex);
    return destroyExternally(blogPosts, postIndex, attachmentIndex, function (err, data, status, headers, config) {
      if(err) {
        return cb(err, data, status, headers, config);
      }
      return destroyLocally(blogPosts, postIndex, attachmentIndex, cb);
    });
  };

  return {
    open: open,
    destroyLocally: destroyLocally,
    destroyExternally: destroyExternally,
    destroy: destroy,
  };
});
angular.module('jumplink.cms.bootstrap.blog', [
  'jumplink.cms.blog',
  'mgcrea.ngStrap',
  'angular-medium-editor',
  'angularFileUpload',
  'ngFocus',
])

.service('BlogBootstrapService', function ($log, focus, BlogService, $modal, FileUploader) {

  var editModal = null;
  var typeModal = null;
  var page = null;

  var openTypeChooserModal = function(blogPost) {
    typeModal.$scope.blogPost = blogPost;
    //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
    typeModal.$promise.then(typeModal.show);
  };

  var setModals = function($scope, fileOptions, pageString, onFileCompleteCallback) {

    if(!angular.isString(page)) {
      page = pageString;
    }

    editModal = $modal({title: 'Blogpost bearbeiten', templateUrl: '/views/modern/blog/editmodal.bootstrap.jade', show: false});
    editModal.$scope.ok = false;
    editModal.$scope.accept = function (hide) {
      editModal.$scope.ok = true;
      hide();
    };
    editModal.$scope.abort = function (hide) {
      editModal.$scope.ok = false;
      hide();
    };

    // set default fileOptions
    if(angular.isUndefined(fileOptions)) {
      fileOptions = {
        path: 'assets/files/blog', // TODO get path from config
        thumbnail: {
          width: 300,
          path: 'assets/files/blog' // TODO get path from config
        },
        rescrop: {
          width: 1200,
          cropwidth: 1200,
          cropheight: 1200,
        }
      };
    }

    var uploadOptions = {
      url: 'blog/upload',
      removeAfterUpload: true,
      // WARN: headers HTML5 only
      headers: {
        options: JSON.stringify(fileOptions)
      }
    };

    editModal.$scope.uploader = new FileUploader(uploadOptions);
    editModal.$scope.openTypeChooserModal = openTypeChooserModal;

    if(angular.isFunction(onFileCompleteCallback)) {
      $scope.uploader.onComplete = onFileCompleteCallback;
    }

    editModal.$scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
      $log.debug("[BlogBootstrapService.onCompleteItem] fileItem", fileItem, "response", response);
      if(!angular.isArray(fileItem.blogPost.attachments)) {
        fileItem.blogPost.attachments = [];
      }
      for (var i = 0; i < response.files.length; i++) {
        fileItem.blogPost.attachments.push(response.files[i]);
      }
    };

    editModal.$scope.uploader.onProgressItem = function(fileItem, progress) {
      $log.debug('[BlogBootstrapService.onProgressItem]', fileItem, progress);
    };

    editModal.$scope.upload = function(fileItem, blogPost) {
      fileItem.blogPost = blogPost;
      fileItem.upload();
    };

    typeModal = $modal({title: 'Typ wählen', templateUrl: '/views/modern/blog/typechoosermodal.bootstrap.jade', show: false});
    typeModal.$scope.chooseType = BlogService.chooseType;

    editModal.$scope.$on('modal.hide.before',function(modalEvent, editModal) {
      $log.debug("edit closed", editModal.$scope.blogPost, editModal);
      if(editModal.$scope.ok) {
        // BlogService.saveOne(null, editModal.$scope.blogPost, null, page, function (err, result) {
        //   editModal.$scope.blogPost = result
        //   return BlogService.validate(editModal.$scope.blogPost, null, editModal.$scope.callback);
        // });
        return BlogService.validate(editModal.$scope.blogPost, null, editModal.$scope.callback);
      } else {
        if(editModal.$scope.callback) {
          editModal.$scope.callback("discarded", editModal.$scope.blogPost);
        }
      }
    });

    return getModals();
  };

  var getEditModal = function() {
    return editModal;
  };

  var getTypeModal = function() {
    return typeModal;
  };

  var getModals = function() {
    return {
      editModal: getTypeModal(),
      typeModal: getTypeModal()
    };
  };

  var edit = function(blogPost, cb) {
    $log.debug("[BlogService.edit]", blogPost);
    editModal.$scope.blogPost = blogPost;
    editModal.$scope.callback = cb;
    editModal.$scope.ok = false;

    focus('blogposttitle');
    //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);
  };

  var createEdit = function(blogPosts, blogPost, cb) {
    blogPost = BlogService.create(blogPost); 
    edit(blogPost, cb);
  };

  return {
    edit: edit,
    update: edit, // alias
    createEdit: createEdit,
    setModals: setModals,
    openTypeChooserModal: openTypeChooserModal,
  };
});
angular.module('jumplink.cms.blog', [
  'jumplink.cms.attachment',
  'angularMoment',
  'ngAsync',
  'sails.io',
])

.service('BlogService', function (moment, $sailsSocket, $async, $log, $filter, AttachmentService) {

  var types = ['news', 'other'];

  /**
   * delete attachment on local / client / browser
   */
  var deleteAttachmentLocally = AttachmentService.destroyLocally;

  /**
   * delete attachment extern / server
   */
  var deleteAttachmentExternally = AttachmentService.destroyExternally;

  var deleteAttachment = AttachmentService.destroy;

  var validate = function (blogPost, page, callback) {
    if(blogPost.title) {
      return fix(blogPost, page, callback);
    }
    if(angular.isFunction(callback)) {
      return callback("Title not set", blogPost);
    }
    return null;
  };

  var chooseType = function(blogPost, type) {
    blogPost.type = type;
  };

  var removeFromClient = function (blogPosts, blogPost, callback) {
    // $log.debug("removeFromClient", blogPost);
    var index = blogPosts.indexOf(blogPost);
    if (index > -1) {
      blogPosts.splice(index, 1);
      if(angular.isFunction(callback)) {
        callback(null, blogPosts);
      }
    } else {
      if(angular.isFunction(callback)) {
        callback("no blogPost on client site found to remove", blogPosts);
      }
    }
  };

  var destroy = function(blogPosts, blogPost, callback) {
    // $log.debug("remove blogPost", blogPost);
    if(blogPost.id) {
      $log.debug("[jumplink.cms.blog.BlogService.destroy]", blogPost);
      $sailsSocket.delete('/blog/'+blogPost.id).success(function(users, status, headers, config) {
        removeFromClient(blogPosts, blogPost, callback);
      });
    } else {
      removeFromClient(blogPosts, blogPost, callback);
    }
  };

  var sort = function(blogPosts) {
    var reverse = true;
    return $filter('orderBy')(blogPosts, 'createdAt', reverse);
  };

  var transform = function(blogPosts) {
    blogPosts = sort(blogPosts);
    return blogPosts;
  };

  var append = function(blogPosts, moreBlogPosts, callback) {
    blogPosts.push.apply(blogPosts, moreBlogPosts);
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var prepent = function(blogPosts, blogPost, callback) {
    blogPosts.unshift(blogPost);
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var create = function(data) {
    if(!data || !data.createdAt) {
      data.createdAt = moment();
    }
    // if(!data || !data.updatedAt) data.createdAt = moment();
    if(!data || !data.title) {
      data.title = "";
    }
    if(!data || !data.content) {
      data.content = "";
    }
    if(!data || !data.author) {
      data.author = "";
    }
    if(!data || !data.page) {
      callback("Page not set.");
    }
    if(!data || !data.type) {
      data.type = types[0]; // news
    }
    $log.debug("[BlogService,create]", data);
    return data;
  };

  var createEdit = function(blogPosts, blogPost, callback) {
    blogPost = create(blogPost); 
    edit(blogPost, callback);
  };

  var fix = function(object, page, callback) {
    if(angular.isUndefined(object.page) && page !== null) {
      object.page = page;
    }
    if(!object.name || object.name === "") {
      // Set object.name to object.title but only the letters in lower case
      object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
      // $log.debug("set object.name to", object.name);
    }
    if(angular.isFunction(callback)) {
      return callback(null, object);
    }
    return object;
  };

  var fixEach = function(objects, page, callback) {
    for (var i = objects.length - 1; i >= 0; i--) {
      objects[i] = fix(objects[i], page);
    }
    if(angular.isFunction(callback)) {
      return callback(null, objects);
    }
    return objects;
  };

  var refresh = function(blogPosts, callback) {
    $log.debug("[jumplink.cms.blog.BlogService.refresh]");
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var saveOne = function (blogPosts, blogPost, index, page, callback) {
    var errors = [
      "BlogService: Can't save blogPost.",
      "BlogService: Can't save blogPost, blogPost to update not found.",
      "BlogService: Can't save blogPost, parameters undefind.",
    ];
    $log.debug("[BlogService.saveOne]", blogPost);
    if(angular.isDefined(blogPost) && angular.isDefined(callback)) {
      blogPost = fix(blogPost, page);
      if(angular.isUndefined(blogPost.id)) {
        // create because id is undefined
        $sailsSocket.post('/blog', blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          callback(null, data);
        }).error(function (data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          $log.error(data, status, headers, config);
          return callback(errors[0]);
        });
      } else {
        // update because id is defined
        $sailsSocket.put('/blog/'+blogPost.id, blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          return callback(null, data);
        }).error(function (data, status, headers, config) {
          $log.error(data, status, headers, config);
          return callback(errors[0]);
        });
      }
    } else {
      return callback(errors[2]);
    }
  };

  var saveBlocks = function(blogPosts, page, callback) {
    var errors = [
      "[BlogService.saveBlocks] Can't save blogPosts, parameters undefind."
    ];
    // save just this blogPost if defined
    if(angular.isDefined(blogPosts) && angular.isDefined(callback)) {
      $async.map(blogPosts, function (blogPost, callback) {
        saveOne(blogPosts, blogPost, null, page, callback);
      }, function(err, blogPostsArray) {
        if(err) {
          return callback(err);
        }
        blogPosts = transform(blogPosts);
        return callback(null, blogPosts);
      });
    } else {
      $log.error(errors[0]);
      if(angular.isFunction(callback)) {
        return callback(errors[0]);
      }
    }
  };

  var save = function(blogPosts, blogPost, index, page, callback) {
    // save just this blogPost if defined
    if(angular.isDefined(blogPost)) {
      saveOne(blogPosts, blogPost, index, page, callback);
    } else { // save all blogPostBlocks
      saveBlocks(blogPosts, page, callback);
    }
  };

  var find = function(page, limit, skip, callback) {
    return $sailsSocket.put('/blog/find', {page:page, limit:limit, skip:skip}).then (function (data) {
      data.data = transform(data.data);
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    }, function error (resp){
      $log.error("Error on find "+page, resp);
      if(angular.isFunction(callback)) {
        return callback(resp);
      }
      return null;
    });
  };

  var count = function(page, limit, skip, callback) {
    return $sailsSocket.put('/blog/count', {page:page}).then (function (data) {
      // $log.debug(data);
      if(angular.isFunction(callback)) {
        return callback(null, data.data.count);
      }
      return data.data.count;
    }, function error (resp){
      $log.error("Error on resolve "+page, resp);
      if(angular.isFunction(callback)) {
        return callback(resp);
      }
      return null;
    });
  };

  var subscribe = function () {
    $sailsSocket.subscribe('blog', function(msg){
      $log.debug(msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde aktualisiert', msg.data.title);
          }
          findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
            if(error) {
              $log.debug(error);
            }
            else {
              blogPost = msg.data;
            }
            $scope.refresh();
          });
        break;
        case 'created':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde erstellt', msg.data.title);
          }
          $scope.blogPosts.push(msg.data);
          $scope.refresh();
        break;
        case 'removedFrom':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde entfernt', msg.data.title);
          }
          findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
            if(error) {
              $log.debug(error);
            }
            else {
              BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            }
          });
        break;
        case 'destroyed':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde gelöscht', msg.data.title);
          }
          findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            else {
              BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            }
          });
        break;
        case 'addedTo':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde hinzugefügt', msg.data.title);
          }
        break;
      }
    });
  };

  return {
    validate: validate,
    subscribe: subscribe,
    append: append,
    prepent: prepent,
    sort: sort,
    transform: transform,
    saveOne: saveOne,
    saveBlocks: saveBlocks,
    save: save,
    fixEach: fixEach,
    find: find,
    resolve: find, // alias
    count: count,
    refresh: refresh,
    chooseType: chooseType,
    removeFromClient: removeFromClient,
    remove: destroy, // alias
    destroy: destroy,
    deleteAttachment: deleteAttachment,
    destroyAttachment: deleteAttachment, // alias
    create: create
  };
});
angular.module('jumplink.cms.browser', [])
.directive('jlBrowser', function ($compile, $window) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/browser.bootstrap.jade',
    scope: {
      force: "="
    },
    link: function ($scope, $element, $attrs) {
      
    }
  };
});
angular.module('jumplink.cms.config', [
  'sails.io',
])
.service('ConfigService', function ($sailsSocket, $filter, $log) {
  var resolve = function(page) {
    return $sailsSocket.get('/config/find').then (function (data) {
      return data.data;
    }, function error (resp){
      $log.error("Error on resolve "+page, resp);
    });
  };
  return {
    resolve: resolve
  };
});
angular.module('jumplink.cms.content', [
    'mgcrea.ngStrap',
    'angular-medium-editor',
    'ui.ace',
    'sails.io',
    'jumplink.cms.sortable',
    'ngFocus'
  ])
  .service('ContentService', function ($rootScope, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {

    var showHtml = false;
    var editModal = null;

    var getShowHtml = function() {
      return showHtml;
    };

    var setEditModal = function($scope) {
      editModal = $modal({title: 'Inhaltsblock bearbeiten', templateUrl: '/views/modern/contentmodal.jade', show: false});
      editModal.$scope.ok = false;
      editModal.$scope.accept = function (hide) {
        editModal.$scope.ok = true;
        hide();
      };
      editModal.$scope.abort = function (hide) {
        editModal.$scope.ok = false;
        hide();
      };
      editModal.$scope.changeName = false;

      editModal.$scope.$watch('content.title', function(newValue, oldValue) {
        // $log.debug("Content in Content Modal changed!", "new", newValue, "old", oldValue);
        if(editModal.$scope.changeName && angular.isDefined(editModal.$scope.content)) {
          editModal.$scope.content.name = generateName(newValue);
        }
      });

      editModal.$scope.$on('modal.hide.before',function(event, editModal) {
        // $log.debug("edit closed", event, editModal);
        editModal.$scope.changeName = false;
        if(editModal.$scope.ok) {
          return validateContent(editModal.$scope.content, editModal.$scope.callback);
        }
        if(angular.isFunction(editModal.$scope.callback)) {
          return editModal.$scope.callback("discarded", editModal.$scope.content);
        }
      });
      return getEditModal();
    };

    var getEditModal = function() {
      return editModal;
    };

    var subscribe = function() {
      // called on content changes
      $sailsSocket.subscribe('content', function(msg){
        $log.debug("Content event!", msg);
        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Seite wurde aktualisiert', msg.id);
            }
          break;
        }
      });
    };

    var toogleShowHtml = function(contents, callback) {
      showHtml = !showHtml;
      if(showHtml && contents) {
        contents = beautifyEach(contents);
      }
      if(angular.isFunction(callback)) {
        return callback(null, showHtml);
      }
      return showHtml;
    };

    var beautify = function(content, callback) {
      content.content = html_beautify(content.content);
      if(angular.isFunction(callback)) {
        return callback(null, content);
      }
      return content;
    };

    var beautifyEach = function(contents, callback) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i].content = beautify(contents[i].content);
      }
      if(angular.isFunction(callback)) {
        return callback(null, contents);
      }
      return contents;
    };

    var getByName = function (contents, name) {
      var index = UtilityService.findKeyValue(contents, 'name', name);
      if(index > -1) {
        return contents[index];
      }
      return null;
    };

    var create = function(data) {
      if(!data || !data.content) {
        data.content = "";
      }
      if(!data || !data.title) {
        data.title = "";
      }
      if(!data || !data.name) {
        data.name = "";
      }
      if(!data || !data.type) {
        data.type = "dynamic";
      }
      if(!data || !data.page) {
        callback("Page not set.");
      }
      return data;
    };

    var append = function(contents, content, callback) {
      SortableService.append(contents, content, callback, true, 'name');
    };

    var createEdit = function(contents, page, callback) {
      var data = create({page:page});
      edit(data, callback, true);
    };

    var swap = function(contents, index_1, index_2, callback) {
      return SortableService.swap(contents, index_1, index_2, callback);
    };

    var moveForward = function(index, contents, callback) {
      return SortableService.moveForward(index, contents, callback);
    };

    var moveBackward = function(index, contents, callback) {
      return SortableService.moveBackward(index, contents, callback);
    };

    var validateContent = function (content, callback) {
      if(content.title) {
        return fix(content, callback);
      }
      if(angular.isFunction(callback)) {
        return callback("Title not set", content);
      }
      return null;
    };

    var edit = function(content, callback, changeName) {
      $log.debug("edit", content);
      editModal.$scope.content = content;
      editModal.$scope.callback = callback;
      if(changeName) {
        editModal.$scope.changeName = changeName;
      }
      else {
        editModal.$scope.changeName = false;
      }
      focus('contentedittitle');
      //- Show when some event occurs (use $promise property to ensure the template has been loaded)
      editModal.$promise.then(editModal.show);
    };

    var removeFromClient = function (contents, index, content, callback) {
      return SortableService.remove(index, contents, callback);
    };

    var remove = function(contents, index, content, page, callback) {
      var errors = [
        'Content konnte nicht gelöscht werden.'
      ];
      if(typeof(index) === 'undefined' || index === null) {
        index = contents.indexOf(content);
      }
      // remove from client
      contents = SortableService.remove(contents, index, content);
      // if content has an id it is saved on database, if not, not
      if(content.id) {
        $log.debug("remove from server, too" ,content);
        $sailsSocket.delete('/content/'+content.id+"?page="+page, {id:content.id, page: page}).success(function(data, status, headers, config) {
          if(angular.isFunction(callback)) {
            return callback(null, contents);
          }
          return contents;
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            return callback(data);
          }
          return data;
        });
      } else {
        if(angular.isFunction(callback)) {
          return callback(null, contents);
        }
        return contents;
      }
    };

    var refresh = function(contents, callback) {
      fixEach(contents, function(err, contents) {
        if(err) {
          $log.error(err);
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        beautifyEach(contents, function(err, contents) {
          if(err) {
            $log.error(err);
            if(angular.isFunction(callback)) {
              return callback(err);
            }
            return err;
          }
          if(angular.isFunction(callback)) {
            return callback(null, contents);
          }
          return contents;
        });
      });
    };

    var generateName = function (title) {
      var name = "";
      if(title && title !== "") {
        // Set content.name to content.title but only the letters in lower case
        name = title.toLowerCase().replace(/[^a-z1-9]+/g, '');
        $log.debug("set content.name to", name);
      }
      return name;
    };

    /*
     * Validate and fix content to make it saveable
     */
    var fix = function(content, callback) {

      if(angular.isDefined(content)) {
        if(angular.isUndefined(content.name) || content.name === '' || content.name === null) {
          content.name = generateName(content.title);
        }

        if(!angular.isNumber(content.position)) {
          content.position = 0;
        }

        if(!content.type || content.type === "") {
          $log.warn("Fix content type not set, set it to dynamic");
          content.type = 'fix';
        }
      } else {
        if(angular.isFunction(callback)) {
          return callback("content not set");
        }
        return null;
      }

      if(angular.isFunction(callback)) {
        return callback(null, content);
      }
      return content;
    };

    /*
     * Validate and fix all contents to make them saveable
     */
    var fixEach = function(contents, callback) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i] = fix(contents[i]);
      }
      if(angular.isFunction(callback)) {
        return callback(null, contents);
      }
      return contents;
    };

    var saveOne = function(content, page, callback) {
      var errors = [
        'Inhalt konnte nicht gespeichert werden'
      ];
      content.page = page;
      fix(content, function(err, content) {
        if(err) {
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        $sailsSocket.put('/content/replace', content).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data !== null && typeof(data) !== "undefined") {
            content = data;
            // $log.debug (content);
            if(angular.isFunction(callback)) {
              return callback(null, content);
            }
            return content;
          } else {
            $log.error(errors[0]);
            if(angular.isFunction(callback)) {
              return callback(errors[0]);
            }
            return errors[0];
          }
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            return callback(data);
          }
          return data;
        });
      });
    };

    var save = function(contents, page, callback) {
      var errors = [
        'Seite konnte nicht gespeichert werden'
      ];
      fixEach(contents, function(err, contents) {
        if(err) {
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        return $sailsSocket.put('/content/replaceall', {contents: contents, page: page}).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data !== null && typeof(data) !== "undefined") {
            contents = $filter('orderBy')(data, 'position');
            // $log.debug (data);
            if(angular.isFunction(callback)) {
              return callback(null, contents);
            }
            return contents;
          }
          $log.error(errors[0]);
          if(angular.isFunction(callback)) {
            return callback(errors[0]);
          }
          return errors[0];
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            callback(data);
          }
        });
      });
    };

    var findOne = function(page, name, type, callback, next) {
      var errors = [
        "Error: On trying to find one with page: "+page+", name: "+name,
        "request has more than one results"
      ];
      var query = {
        page: page,
        name: name
      };
      var url = '/content/find';
      if(type) {
        query.type = type;
      }
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          return null;
        }
        if(data.data instanceof Array) {
          data.data = data.data[0];
          $log.error(errors[1]);
        }
        // data.data.content = html_beautify(data.data.content);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          return callback(null, data.data);
        }
        return data.data;
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    var findAll = function(page, type, callback, next) {
      var errors = [
        "Error: On trying to find all with page: "+page+" and type: "+type,
        "Warn: On trying to find all "+page+" contents! Not found, content is empty!"
      ];
      var query = {
        page: page,
      };
      var url = '/content/findall';
      if(type) {
        query.type = type;
      }
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          $log.warn(errors[1]);
          return null;
        }
        // data.data.content = html_beautify(data.data.content);
        data.data = $filter('orderBy')(data.data, 'position');
        // $log.debug(data);
        if(next) {
          data.data = next(data.data);
        }

        if(angular.isFunction(callback)) {
          callback(null, data.data);
        } else {
          return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    /*
     * get all contents for page including images for each content.name 
     */
    var findAllWithImage = function(page, type, callback, next) {
      // $log.debug("findAllWithImage");
      var errors = [
        "Error: On trying to find all with page: "+page+" and type: "+type,
        "Warn: On trying to find all "+page+" contents! Not found, content is empty!"
      ];
      var query = {
        page: page
      };
      var url = '/content/findAllWithImage?page='+page;
      if(type) {
        query.type = type;
        url = url+'&type='+type;
      }
      return $sailsSocket.get(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          $log.warn(errors[1]);
          return null;
        }
        // data.data.content = html_beautify(data.data.content);
        data.data.contents = $filter('orderBy')(data.data.contents, 'position');
        data.data.images = $filter('orderBy')(data.data.images, 'position');
        // $log.debug(data);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          return callback(null, data.data);
        }
        return data.data;
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    /**
     * Resolve function for angular ui-router.
     * name, callback and next parameters are optional.
     * use next to transform the result before you get it back
     * use callback if you want not use promise
     */
    var find = function(page, name, type, callback, next) {
      //- get soecial content (one)
      if(angular.isDefined(name)) {
        return findOne(page, name, type, next);
      // get all for page
      } else {
        return findAll(page, type, callback, next);
      }
    };

    return {
      subscribe: subscribe,
      setEditModal: setEditModal,
      getShowHtml: getShowHtml,
      toogleShowHtml: toogleShowHtml,
      beautify: beautify,
      beautifyEach: beautifyEach,
      create: create,
      createEdit: createEdit,
      append: append,
      swap: swap,
      moveForward: moveForward,
      moveBackward: moveBackward,
      edit: edit,
      removeFromClient: removeFromClient,
      remove: remove,
      refresh: refresh,
      fix: fix,
      fixEach: fixEach,
      save: save,
      saveOne: saveOne,
      find: find,
      resolve: find, // alias
      findOne: findOne,
      resolveOne: findOne, // alias
      findAll: findAll, 
      resolveAll: findAll, //alias
      findAllWithImage: findAllWithImage,
      resolveAllWithImage: findAllWithImage,  //alias
      getByName: getByName
    };
  })
;
angular.module('jumplink.cms.content.medium', [
  'jumplink.cms.content',
  'angular-medium-editor',
])
.value('mediumOptions', {
  buttonLabels: "fontawesome",
  toolbar: {
    buttons: ["bold", "italic", "underline", "anchor", "h2", "h3", "h4", "quote", "orderedlist", "unorderedlist"]
  }
})
.service('ContentMediumService', function ($rootScope, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {
  // TODO
  var Imager = function () {
    this.button = document.createElement('button');
    this.button.className = 'medium-editor-action';
    this.button.innerText = 'Image';
    this.button.innerHTML = '<i class="fa fa-picture-o"></i>';
    this.button.onclick = this.onClick.bind(this);
    // this.classApplier = rangy.createCssClassApplier('highlight', {
    //   elementTagName: 'mark',
    //   normalize: true
    // });
  };
  Imager.prototype.onClick = function() {
    this.classApplier.toggleSelection();
  };
  Imager.prototype.getButton = function() {
    return this.button;
  };
  Imager.prototype.checkState = function(node) {
    if (node.tagName === 'MARK') {
      this.button.classList.add('medium-editor-button-active');
    }
  };

  return {
    Imager: Imager
  };
})
.directive('jlContent', function ($compile, $window, mediumOptions, ContentMediumService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/content.jade',
    scope: {
      authenticated : "=",
      html: "=",
      content: "=?",
      mediumOptions: "=?",
      mediumBindOptions: "=?",
    },
    link: function ($scope, $element, $attrs) {
      if(angular.isUndefined($scope.mediumOptions)) {
        $scope.mediumOptions = mediumOptions;
      }
      if(angular.isUndefined($scope.mediumBindOptions)) {
        $scope.mediumBindOptions = {
          extensions: {
            'image': new ContentMediumService.Imager()
          }
        };
      }
    }
  };
});
// window.saveAs
// Shims the saveAs method, using saveBlob in IE10. 
// And for when Chrome and FireFox get round to implementing saveAs we have their vendor prefixes ready. 
// But otherwise this creates a object URL resource and opens it on an anchor tag which contains the "download" attribute (Chrome)
// ... or opens it in a new tab (FireFox)
// @author Andrew Dodson
// @copyright MIT, BSD. Free to clone, modify and distribute for commercial and personal use.
// window.saveAs || ( window.saveAs = (window.navigator.msSaveBlob ? function(b,n){ return window.navigator.msSaveBlob(b,n); } : false) || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs || (function(){
//   // URL's
//   window.URL || (window.URL = window.webkitURL);
//   if(!window.URL){
//     return false;
//   }
//   return function(blob,name){
//     var url = URL.createObjectURL(blob);
//     // Test for download link support
//     if( "download" in document.createElement("a") ){
//       var a = document.createElement("a");
//       a.setAttribute("href", url);
//       a.setAttribute("download", name);
//       // Create Click event
//       var clickEvent = document.createEvent ("MouseEvent");
//       clickEvent.initMouseEvent ("click", true, true, window, 0, 
//         clickEvent.screenX, clickEvent.screenY, clickEvent.clientX, clickEvent.clientY, 
//         clickEvent.ctrlKey, clickEvent.altKey, clickEvent.shiftKey, clickEvent.metaKey, 
//         0, null);
//       // dispatch click event to simulate download
//       a.dispatchEvent (clickEvent);
//     }
//     else{
//       // fallover, open resource in new tab.
//       window.open(url, "_blank", "");
//     }
//   };
// })() );

// Source: https://github.com/darius/requestAnimationFrame
// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon

// MIT license

if (!Date.now) {
  Date.now = function() { return new Date().getTime(); };
}

(function() {
    'use strict';

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame'] || window[vp+'CancelRequestAnimationFrame']);
    }
    // iOS6 is buggy
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function(callback) {
          var now = Date.now();
          var nextTime = Math.max(lastTime + 16, now);
          return setTimeout(function() { callback(lastTime = nextTime); }, nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }
}());
angular.module('jumplink.cms.event', [
  'mgcrea.ngStrap',
  'angular-medium-editor',
  'angularFileUpload',
  'angularMoment',
  'ngFocus',
  'ngAsync',
  'sails.io',
  'jumplink.cms.utilities',
])
.service('EventService', function (moment, UtilityService, $sailsSocket, $async, $log, focus, $modal, FileUploader) {
  var editModal = null;
  var typeModal = null;
  var types = ['lecture', 'panel discussion', 'travel', 'info', 'food', 'other'];
  var page = null;

  var validate = function (event, callback) {
    if(event.title) {
      return fix(event, callback);
    }
    if(angular.isFunction(callback)) {
      return callback("Title not set", event);
    }
    return null;
  };

  var chooseType = function(event, type, hide) {
    event.type = type;
    hide();
  };

  var openTypeChooserModal = function(event) {
    typeModal.$scope.event = event;
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    typeModal.$promise.then(typeModal.show);
  };

  var setModals = function($scope, fileOptions, pageString) {

    if(!angular.isString(page)) {
      page = pageString;
    }
    
    editModal = $modal({title: 'Ereignis bearbeiten', templateUrl: '/views/modern/events/editmodal.jade', show: false});
    editModal.$scope.ok = false;
    editModal.$scope.accept = function (hide) {
      editModal.$scope.ok = true;
      hide();
    };
    editModal.$scope.abort = function (hide) {
      editModal.$scope.ok = false;
      hide();
    };

    // set default fileOptions
    if(angular.isUndefined(fileOptions)) {
      fileOptions = {};
    }

    var uploadOptions = {
      url: 'timeline/upload',
      removeAfterUpload: true,
      // WARN: headers HTML5 only
      headers: {
        options: JSON.stringify(fileOptions)
      }
    };

    editModal.$scope.uploader = new FileUploader(uploadOptions);
    editModal.$scope.openTypeChooserModal = openTypeChooserModal;

    editModal.$scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
      fileItem.event.download = response.files[0].uploadedAs;
    };
    editModal.$scope.uploader.onProgressItem = function(fileItem, progress) {
      console.info('onProgressItem', fileItem, progress);
    };
    editModal.$scope.upload = function(fileItem, event) {
      fileItem.event = event;
      fileItem.upload();
    };
    typeModal = $modal({title: 'Typ wählen', templateUrl: '/views/modern/events/typechoosermodal.jade', show: false});
    typeModal.$scope.chooseType = chooseType;
    editModal.$scope.$on('modal.hide.before',function(event, editModal) {
      $log.debug("edit closed", event, editModal);
      if(editModal.$scope.ok) {
        return validate(editModal.$scope.event, editModal.$scope.callback);
      }
      if(angular.isFunction(editModal.$scope.callback)) {
        return editModal.$scope.callback("discarded", editModal.$scope.event);
      }
    });
    return getModals();
  };

  var getEditModal = function() {
    return editModal;
  };

  var getTypeModal = function() {
    return typeModal;
  };

  var getModals = function() {
    return {
      editModal: getTypeModal(),
      typeModal: getTypeModal()
    };
  };

  var edit = function(event, eventBlockName, callback) {
    // $log.debug("edit", event);
    editModal.$scope.event = event;
    // editModal.$scope.eventBlockName = eventBlockName;
    editModal.$scope.callback = callback;
    editModal.$scope.ok = false;
    focus('eventtitle');
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);
  };

  var split = function(events) {
    var unknown = [], before = [], after = [];
    for (var i = 0; i < events.length; i++) {
      if(angular.isDefined(events[i].to)) {
        events[i].to = moment(events[i].to);
      }
      if(angular.isDefined(events[i].from)) {
        events[i].from = moment(events[i].from);
        if(events[i].from.isAfter()) {
          after.push(events[i]);
        }
        else {
          before.push(events[i]);
        }
      } else {
        unknown.push(events[i]);
      }
    }
    return {unknown:unknown, before:before, after:after};
  };

  var removeFromClient = function (events, event, eventBlockName, callback) {
    var errors = [
      "no event on client site found to remove"
    ];
    var index = events[eventBlockName].indexOf(event);
    if (index > -1) {
      events[eventBlockName].splice(index, 1);
      if(angular.isFunction(callback)) {
        return callback(null, events);
      }
      return events;
    }
    if(angular.isFunction(callback)) {
      return callback(errors[0], events);
    }
    return errors[0];
  };

  var remove = function(events, event, eventBlockName, callback) {
    // $log.debug("remove event", event, eventBlockName);
    if(event.id) {
      $log.debug(event);
      $sailsSocket.delete('/timeline/'+event.id).success(function(users, status, headers, config) {
        removeFromClient(events, event, eventBlockName, callback);
      });
    } else {
      removeFromClient(events, event, eventBlockName, callback);
    }
  };

  var transform = function(events) {
    events = split(events);
    events.before = UtilityService.invertOrder(events.before);
    return events;
  };

  var merge = function(unknown, before, after) {
    if(angular.isUndefined(unknown)) {
      unknown = [];
    }
    if(angular.isUndefined(before)) {
      before = [];
    }
    if(angular.isUndefined(after)) {
      after = [];
    }
    return unknown.concat(before).concat(after);
  };

  var append = function(events, event, callback) {
    events.unknown.push(event);
    var allEvents = merge(events.unknown, events.before, events.after);
    events = transform(allEvents);
    if(angular.isFunction(callback)) {
      return callback(null, events);
    }
    return events;
  };

  var create = function(data) {
    if(!data || !data.from) {
      data.from = moment();
      data.from.add(1, 'hours');
      data.from.minutes(0);
    }
    if(!data || !data.title) {
      data.title = "";
    }
    if(!data || !data.person) {
      data.person = "";
    }
    if(!data || !data.place) {
      data.place = "";
    }
    if(!data || !data.page) {
      callback("Page not set.");
    }
    return data;
  };

  var createEdit = function(events, event, callback) {
    event = create(event); 
    edit(event, null, callback);
  };

  var fix = function(object, callback) {
    if(!object.name || object.name === "") {
      // Set object.name to object.title but only the letters in lower case
      object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
      // $log.debug("set object.name to", object.name);
    }
    if(angular.isFunction(callback)) {
      return callback(null, object);
    }
    return object;
  };

  var fixEach = function(objects, callback) {
    for (var i = objects.length - 1; i >= 0; i--) {
      objects[i] = fix(objects[i]);
    }
    if(angular.isFunction(callback)) {
      return callback(null, objects);
    }
    return objects;
  };

  var refresh = function(eventBlocks) {
    var allEvents = merge(eventBlocks.unknown, eventBlocks.before, eventBlocks.after);
    // $log.debug("allEvents.length", allEvents.length);
    eventBlocks = transform(allEvents);
    // $log.debug("refreshed");
    return eventBlocks;
  };

  var saveOne = function (eventBlocks, eventBlockName, event, callback) {
    var errors = [
      "EventService: Can't save event.",
      "EventService: Can't save event, event to update not found.",
      "EventService: Can't save event, parameters undefind.",
    ];
    if(angular.isDefined(event) && angular.isDefined(eventBlockName) && angular.isDefined(callback)) {
      event = fix(event);
      if(angular.isUndefined(event.id)) {
        // create because id is undefined
        $sailsSocket.post('/timeline', event).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          // $log.debug("event created", event, data);
          var index = eventBlocks[eventBlockName].indexOf(event);
          if (index > -1) {
            eventBlocks[eventBlockName][index] = data;
            // $log.debug(eventBlocks[eventBlockName][index]);
            callback(null, eventBlocks[eventBlockName][index]);
          } else {
            callback(errors[1]);
          }
        }).error(function (data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          $log.error(data, status, headers, config);
          callback(errors[0]);
        });
      } else {
        // update because id is defined
        $sailsSocket.put('/timeline/'+event.id, event).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          // $log.debug("event updated", event, data);
          event = data;
          callback(null, event);
        }).error(function (data, status, headers, config) {
          $log.error(data, status, headers, config);
          callback(errors[0]);
        });
      }
    } else {
      callback(errors[2]);
    }
  };

  var saveAllInBlock = function(eventBlocks, eventBlockName, callback) {
    $async.map(eventBlocks[eventBlockName], function (event, callback) {
      saveOne(eventBlocks, eventBlockName, event, callback);
    }, callback);
  };


  var saveBlocks = function(eventBlocks, callback) {
    var errors = [
      "EventService: Can't save eventBlocks, parameters undefind."
    ];
    // save just this event if defined
    if(angular.isDefined(eventBlocks) && angular.isDefined(callback)) {
      return $async.map(['after', 'before', 'unknown'], function (eventBlockName, callback) {
        saveAllInBlock(eventBlocks, eventBlockName, callback);
      }, function(err, eventBlocksArray) {
        if(err) {
           $log.error(err);
          if(angular.isFunction(callback)) {
            return callback(err);
          }
        }
        var allEvents = merge(eventBlocksArray[0], eventBlocksArray[1], eventBlocksArray[2]);
        eventBlocks = transform(allEvents);
        return callback(null, eventBlocks);
      });
    }
    $log.error(errors[0]);
    if(angular.isFunction(callback)) {
      return callback(errors[0]);
    }
  };

  var resolve = function(page) {
    return $sailsSocket.get('/timeline').then (function (data) {
      // $log.debug(data);
      return transform(data.data);
    }, function error (resp){
      $log.error("Error on resolve "+page, resp);
    });
  };

  var subscribe = function () {
    $sailsSocket.subscribe('timeline', function(msg){
      $log.debug(msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde aktualisiert', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            event = msg.data;
            $scope.refresh();
          });
        break;
        case 'created':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde erstellt', msg.data.title);
          }
          $scope.events.before.push(msg.data);
          $scope.refresh();
        break;
        case 'removedFrom':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde entfernt', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            EventService.removeFromClient($scope.events, event, eventBlock);
          });
        break;
        case 'destroyed':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde gelöscht', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            EventService.removeFromClient($scope.events, event, eventBlock);
          });
        break;
        case 'addedTo':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde hinzugefügt', msg.data.title);
          }
        break;
      }
    });
  };

  return {
    subscribe: subscribe,
    split: split,
    merge: merge,
    append: append,
    transform: transform,
    saveOne: saveOne,
    saveAllInBlock: saveAllInBlock,
    saveBlocks: saveBlocks,
    edit: edit,
    createEdit: createEdit,
    fixEach: fixEach,
    resolve: resolve,
    setModals: setModals,
    refresh: refresh,
    openTypeChooserModal: openTypeChooserModal,
    chooseType: chooseType,
    removeFromClient: removeFromClient,
    remove: remove
  };
});
angular.module('jumplink.cms.fallback', [
])
.service('FallbackService', function ($window, $location, $log) {

  var go = function(path) {
    var protocol = $location.protocol();
    var host = $location.host();
    if(!angular.isString(path)) {
      path = "/fallback";
    } else {
      if(path.charAt(0) !== '/') {
        path = '/'+path;
      }
    }
    var url = protocol+"://"+host+path+"?force=fallback";
    $log.debug("Go to fallback url: "+url);
    // $window.location.href = url;
  };

  return {
    go: go
  };
});
angular.module('ngFocus', [])
// Source and Copyright: http://stackoverflow.com/questions/25596399/set-element-focus-in-angular-way
.factory('focus', function($timeout, $window) {
  return function(id) {
    // timeout makes sure that it is invoked after any other event has been triggered.
    // e.g. click events that need to run before the focus or
    // inputs elements that are in a disabled state but are enabled when those events
    // are triggered.
    $timeout(function() {
      var element = $window.document.getElementById(id);
      if(element) {
        element.focus();
      }
    });
  };
})
.directive('eventFocus', function(focus) {
  return function(scope, elem, attr) {
    elem.on(attr.eventFocus, function() {
      focus(attr.eventFocusId);
    });

    // Removes bound events in the element itself
    // when the scope is destroyed
    scope.$on('$destroy', function() {
      elem.off(attr.eventFocus);
    });
  };
});
angular.module('jumplink.cms.gallery', [
  'mgcrea.ngStrap',
  'ngAsync',
  'angular-medium-editor',
  'FBAngular',
  'sails.io',
  'angularFileUpload',
  'jumplink.cms.sortable',
  'jumplink.cms.content',
])
.service('GalleryService', function ($rootScope, $sailsSocket, $async, $filter, Fullscreen, SortableService, ContentService, FileUploader, $modal, $log) {

  var editModal = null;
  uploadModal = null;
  fullscreenImage = null;

  var dropdown = [
    {
      "text": "<i class=\"fa fa-eye\"></i>&nbsp;Anzeigen",
      "click": "goToImage(image)"
    },
    {
      "text": "<i class=\"fa fa-edit\"></i>&nbsp;Bearbeiten",
      "click": "editImage(image)"
    },
    {
      "text": "<i class=\"fa fa-trash\"></i>&nbsp;Löschen",
      "click": "$dropdown.hide();$dropdown.destroy();removeImage(image);" // TODO delay
    },
    {
      "text": "<i class=\"fa fa-floppy-o\"></i>&nbsp;Speichern",
      "click": "saveImage(image)"
    }
  ];

  var getDropdown = function () {
    return dropdown;
  };

  var setEditModal = function($scope) {
    editModal = $modal({scope: $scope, title: 'Bild bearbeiten', templateUrl: '/views/modern/gallery/editmodal.jade', show: false});
    return getEditModal();
  };

  var getEditModal = function() {
    return editModal;
  };

  var prepairUploadModal = function (uploadModal, imageBlocks, contentBlocks) {
    
    uploadModal.$scope.imageBlocks = imageBlocks;
    uploadModal.$scope.selects = getSelects(imageBlocks, contentBlocks);
    if(uploadModal.$scope.selects.length > 0) {
      $rootScope.selectedContentBlock = uploadModal.$scope.selects[0].value;
    }

    $rootScope.$watch('selectedContentBlock', function(newValue, oldValue) {
      $log.debug("selected changed to", newValue);
    });

    return uploadModal;
  };

  var setUploadModal = function($scope, imageBlocks, contentBlocks, options, callback, onCompleteCallback) {

    // if options not set, set to default values
    if(angular.isUndefined(options)) {
      options = {
        thumbnail: {
          width: 300,
        },
        rescrop: {
          width: 1200,
          cropwidth: 1200,
          cropheight: 1200,
        }
      };
    }

    var uploadOptions = {
      url: 'gallery/upload',
      removeAfterUpload: true,
      // WARN: headers HTML5 only
      headers: {
        options: JSON.stringify(options)
      }
    };

    $scope.uploader = new FileUploader(uploadOptions);
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function(item /*{File|FileLikeObject}*/, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    if(angular.isFunction(onCompleteCallback)) {
      $scope.uploader.onComplete = onCompleteCallback;
    }

    $scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
      //fileItem.member.image = response.files[0].uploadedAs;
      $log.debug("[GalleryService.uploader.onCompleteItem]",fileItem, response, status, headers);
      // WORKAROUND until the socket method works
      response.files.forEach(function (file, index, files) {

        var selected = $rootScope.selectedContentBlock;
        var imageBlocks = uploadModal.$scope.imageBlocks;
        var currentImages = imageBlocks[selected];

        $log.debug("[GalleryService.$scope.uploader.onCompleteItem] selected", selected, "imageBlocks", imageBlocks, "currentImages", currentImages);

        var last_position = 0;
        if(currentImages.length > 0) {
          last_position = currentImages[currentImages.length-1].position;
        }
        if($rootScope.authenticated) {
          $rootScope.pop('success', 'Ein Bild wurde hochgeladen', file.original.name);
        }
        if(typeof file.position === 'undefined') {
          last_position++;
          file.position = last_position;
          file.content = selected;
        }

        $log.debug("[GalleryService.$scope.uploader.onCompleteItem] file", file);
        
        currentImages.push(file);
      });
    };

    $scope.upload = function(fileItem, image) {
      fileItem.image = image;
      fileItem.upload();
    };

    uploadModal = $modal({scope: $scope, title: 'Bilder hinzufügen', uploader: $scope.uploader, templateUrl: '/views/modern/gallery/uploadimagesmodal.jade', show: false});
    uploadModal = prepairUploadModal(uploadModal, imageBlocks, contentBlocks);

    if(angular.isFunction(callback)) {
      return callback(getUploadModal());
    }
    return getUploadModal();
  };

  var getSelects = function (imageBlocks, contentBlocks) {
    var blockNames = Object.keys(imageBlocks);
    var result = [];
    // console.log("contentBlocks", contentBlocks);
    blockNames.forEach(function (blockName, index, array) {
      var label = ContentService.getByName(contentBlocks, blockName).title || blockName; // TODO WARNING slow!
      result.push({
        label: label,
        value: blockName
      });
    });
    return result;
  };

  var getUploadModal = function() {
    return uploadModal;
  };

  var fix = function(image, page, contentname, callback) {
    if(!image.page || image.page === "") {
      image.page = page;
    }

    if(!image.content || image.content === "") {
      image.content = contentname;
    }

    if(angular.isFunction(callback)) {
      return callback(null, image);
    }
    return image;
  };

  // var setFullScreen = function(image) {
  //   // http://stackoverflow.com/questions/21702375/angularjs-ng-click-over-ng-click
  //   fullscreenImage = image;
  // }

  // var closeFullScreen = function(image) {
  //   Fullscreen.cancel();
  // }

  // Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
  //   if(!isFullscreenEnabled) {
  //     delete fullscreenImage;
  //   }
  //   $scope.$apply();
  // });

  // var isFullScreen = function(image) {
  //   if(angular.isDefined($scope.fullscreenImage) && angular.isDefined($scope.fullscreenImage.original) && angular.isDefined($scope.fullscreenImage.original.name) && $scope.fullscreenImage.original.name == image.original.name) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  var saveOne = function(image, page, contentname, callback) {
    image = fix(image, page, contentname);
    var errors = [
      'Bild konnte nicht gespeichert werden'
    ];
    $sailsSocket.put('/gallery/'+image.id, image).success(function(data, status, headers, config) {
      if(angular.isArray(data)) {
        data = data[0];
      }
      if(angular.isFunction(callback)) {
        callback(null, data);
      }
    }).
    error(function(data, status, headers, config) {
      $log.error (errors[0], data);
      if(angular.isFunction(callback)) {
        callback(errors[0], data);
      }
    });
  };

  var saveAllBlocks = function(imageBlocks, page, callback) {
    var blockNames = Object.keys(imageBlocks);
    // $log.debug("saveAllBlocks","blockNames" , blockNames);

    $async.map(blockNames,
    function iterator(contentname, callback) {
      saveAll(imageBlocks[contentname], page, contentname, callback);
    }, callback);

    // $async.map(images,
    // function iterator(image, callback) {
    //   saveOne(image, page, contentname, callback);
    // }, callback);
  };

  var saveAll = function(images, page, contentname, callback) {
    $async.map(images,
    function iterator(image, callback) {
      saveOne(image, page, contentname, callback);
    }, callback);
  };

  var remove = function(images, index, image, page, callback) {
    if(typeof(index) === 'undefined' || index === null) {
      index = images.indexOf(image);
    }
    images = SortableService.remove(images, index, image);
    // if image has an id it is saved on database, if not, not
    if(image.id) {
      // $log.debug("remove from server, too" ,image);
      $sailsSocket.delete('/gallery/'+image.id+"?filename="+image.original.name+"&page="+page, {id:image.id, filename:image.original.name, page: page}).success(function(data, status, headers, config) {
        if(angular.isFunction(callback)) {
          callback(null, images);
        }
      }).
      error(function(data, status, headers, config) {
        $log.error (errors[0], data);
        if(angular.isFunction(callback)) {
          callback(data);
        }
      });
    } else {
      if(angular.isFunction(callback)) {
        callback(null, images);
      }
    }
  };

  var add = function(imageBlocks, contentBlocks, callback) {
    // $log.debug("add");
    uploadModal.$promise.then(uploadModal.show);

    uploadModal = prepairUploadModal(uploadModal, imageBlocks, contentBlocks);

    uploadModal.$scope.$on('modal.hide',function(){
      $log.debug("upload modal closed");
      if(angular.isFunction(callback)) {
        callback(null);
      }
    });
  };

  // Images for Content
  var addBlock = function(imageBlocks, content, callback) {
    imageBlocks[content.name] = [];
    if(angular.isFunction(callback)) {
      return callback(null, imageBlocks[content.name]);
    }
    return imageBlocks[content.name];
  };

  var edit = function(image, callback) {
    $log.debug("edit", image);
    editModal.$scope.image = image;
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);

    editModal.$scope.$on('modal.hide',function(){
      $log.debug("edit closed");
      if(angular.isFunction(callback)) {
        callback(null, editModal.$scope.image);
      }
    });
  };

  var aspect = function (image, width)  {
    var height, scale, aspectRatio, win, paddingTopBottom = 0, paddingLeftRight = 0;
    if($scope.isFullScreen(image)) {
      // customised jQuery Method of http://css-tricks.com/perfect-full-page-background-image/
      aspectRatio = image.original.width / image.original.height;
      win = $rootScope.getWindowDimensions();
      if(win.width / win.height < aspectRatio) {
        width = win.width; // width 100%
        scale = image.original.width / width;
        height = image.original.height / scale;
        paddingTopBottom = (win.height - height) / 2;
        height = win.height;
      } else {
        height = win.height;  // height 100%
        scale = image.original.height / height;
        width = image.original.width / scale;
        paddingLeftRight = (win.width - width) / 2;
        width = win.width;
      }
      return {width: width+'px', height: height+'px', 'padding-right': paddingLeftRight+"px", 'padding-left': paddingLeftRight+"px", 'padding-top': paddingTopBottom+"px", 'padding-bottom': paddingTopBottom+"px" };
    } else {
      scale = image.original.width / width;
      height =  image.original.height / scale;
      return {width: width+'px', height: height+'px'};
    }
  };

  var subscribe = function () {
    $sailsSocket.subscribe('gallery', function(msg) {
      $log.debug(msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $log.debug('success', 'Ein Bild wurde aktualisiert', msg.data.original.name);
            // $rootScope.pop('success', 'Ein Bild wurde aktualisiert', msg.data.original.name);
          }
        break;
        case 'created':
          // TODO not broadcast / fired why?!
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Bild wurde hochgeladen', msg.data.original.name);
          }
          $scope.images.push(msg.data);
        break;
        case 'removedFrom':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Bild wurde entfernt', "");
          }
          $log.debug(msg.data);
        break;
        case 'destroyed':
          // if($rootScope.authenticated) {
          //   $rootScope.pop('success', 'Ein Bild wurde gelöscht', "");
          // }
          $log.debug(msg.data);
        break;
        case 'addedTo':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Bild wurde hinzugefügt', "");
          }
          $log.debug(msg.data);
        break;
      }
    });
  };

  var resolve = function(page, content) {
    var url = '/gallery?limit=0&page='+page;
    if(content) {
      url = url+'&content='+content;
    }
    return $sailsSocket.get(url).then (function (data) {
      return $filter('orderBy')(data.data, 'position');
    }, function error (resp) {
      $log.error(resp);
    });
  };

  return {
    getDropdown: getDropdown,
    setEditModal: setEditModal,
    getEditModal: getEditModal,
    setUploadModal: setUploadModal,
    getUploadModal: getUploadModal,
    saveOne: saveOne,
    saveAll: saveAll,
    saveAllBlocks: saveAllBlocks,
    remove: remove,
    add: add,
    addBlock: addBlock,
    edit: edit,
    aspect: aspect,
    subscribe: subscribe,
    resolve: resolve
  };
});
if (typeof jumplink === 'undefined') {
  var jumplink = {};
}
angular.module('jumplink.cms.history', [
  'ui.router',
])
/**
 * @see: https://github.com/angular-ui/ui-router/issues/92
 */
.service('HistoryService', function ($window, $location, $state, $anchorScroll, $timeout, $log) {
  var history = [];
  var push = function(state, params) {
    history.push({ state: state, params: params });
  };

  var all = function() {
    return history;
  };

  var go = function(step) {
    $log.debug('[jumplink.cms.history.HistoryService], history.length', history.length, 'step', step, 'history.length + step =', history.length + step);
    // If the past has not been saved as far as the steps that we want to go back, then go to the beginning of time
    if(history.length + step <= 0) {
     return $location.path('/');
    }
    // TODOlocation    // (1) Determine # of states in stack with URLs, attempt to
    //    shell out to $window.history when possible
    // (2) Attempt to figure out some algorthim for reversing that,
    //     so you can also go forward
    var prev = this.previous(step || -1);
    return $state.go(prev.state, prev.params);
  };

  var previous = function(step) {
    return history[history.length - Math.abs(step || 1)];
  };

  var back = function() {
    return this.go(-1);
  };

  var goToHashPosition = function (hash) {
    // $log.debug("go to hash", hash);
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  };

  var autoScroll = function () {
    var hash = $location.hash();
    // $log.debug("hash", hash);
    if(hash) {
      // WORKAROUND
      $timeout(function(){ goToHashPosition(hash); }, 1000); // TODO smooth?
    } else {
      $anchorScroll();
    }    
  };

  return {
    push: push,
    all: all,
    go: go,
    previous: previous,
    back: back,
    goToHashPosition: goToHashPosition,
    autoScroll: autoScroll
  };

})
.run(function(HistoryService, $state, $rootScope) {

  $rootScope.$on("$stateChangeSuccess", function(event, to, toParams, from, fromParams) {
    if (!from.abstract) {
      HistoryService.push(from, fromParams);
    }
  });
  console.log(HistoryService);
  HistoryService.push($state.current, $state.params);

});
angular.module('jumplink.cms.info', [
  'sails.io',
])

.service('CmsService', function ($log, $sailsSocket) {

  var info = function(url, callback) {
    var errors = [
      "[CmsService] Error: On trying to get cms info, url: "+url,
      "[CmsService] Error: Result is null, url: "+url
    ];
    var warns = [
      "[CmsService] Warn: Request has more than one results, url: "+url
    ];
    return $sailsSocket.get(url).then (function (data) {
      if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
        if(angular.isFunction(callback)) {
          return callback(errors[1]);
        }
        return null;
      }
      if (data.data instanceof Array) {
        data.data = data.data[0];
        $log.warn(warns[0]);
      }
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    }, function error (resp){
      $log.error(errors[0], resp);
      if(angular.isFunction(callback)) {
        return callback(errors[0], resp);
      }
      return resp;
    });
  };

  // CMS Info for Users
  var infoUser = function(callback) {
    return info('/cms/infouser', callback);
  };

  var infoAdmin = function(callback) {
    return info('/cms/infoadmin', callback);
  };

  var restart = function(callback) {
    return $sailsSocket.post('/cms/restart').then (function (data) {
      $log.debug("[CmsService.restart]", data);
      return callback(null, data);
    }, function error (resp){
      $log.error("[CmsService.restart]", resp);
      return callback(resp);
    });
  };


  /**
   * Public functions
   */
  return {
    infoUser: infoUser,
    infoAdmin: infoAdmin,
    restart: restart,
  };
});
angular.module('jumplink.cms.multisite', [
  'sails.io',
  'jumplink.cms.sails'
])
.service('MultisiteService', function ($rootScope, JLSailsService, $log) {

  var resolve = function(query, callback) {
    // $log.debug("[MultisiteService.resolve]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/find', query, options, callback);
  };

  var resolveNames = function(query, callback) {
    // $log.debug("[MultisiteService.resolveNames]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/findnames', query, options, callback);
  };

  var resolveHosts = function(query, callback) {
    // $log.debug("[MultisiteService.resolveNames]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/findhosts', query, options, callback);
  };

  return {
    resolve: resolve,
    resolveNames: resolveNames,
    resolveHosts: resolveHosts
  };
});
angular.module('jumplink.cms.routes', [
  'ui.router',                 // AngularUI Router: https://github.com/angular-ui/ui-router
  'jumplink.cms.sails',
  'jumplink.cms.sortable',
  'jumplink.cms.utilities',
])
.provider('jlRoutes', function jlRoutesProvider($stateProvider, $urlRouterProvider, $locationProvider) {

  this.html5Mode = $locationProvider.html5Mode;

  this.otherwise = $urlRouterProvider.otherwise;

  this.state = $stateProvider.state;

  this.setRoutes = function(routes, routeOptions) {
    /**
     * Load optional addional states.
     * WARNING: Very experimental and dangerous.
     */
    for (var i = 0; i < routes.length; i++) {
      // if is Main Route
      if(routes[i].main) {
        var options = {};
        // set state main url
        if(typeof(routes[i].url) === 'string' && routes[i].url.length > 0) {
          options.url = routes[i].url;
        }
        // WARNING custom states are very experimental
        if(routes[i].customstate === true) {
          // TODO Dirty hack!
          if(angular.isDefined(routes[i].state.resolve) && typeof(routes[i].state.resolve) === 'string' && routes[i].state.resolve.length > 0) {
            /* jshint ignore:start */
            eval(routes[i].state.resolve);
            /* jshint ignore:end */
            options.resolve = resolve;
          }
          // TODO Dirty hack!
          if(angular.isDefined(routes[i].state.views) && typeof(routes[i].state.views) === 'string' && routes[i].state.views.length > 0) {
            /* jshint ignore:start */
            eval(routes[i].state.views);
            /* jshint ignore:end */
            options.views = view;
          }
        // states wich are defined in routeOptions
        } else {
          // set state options
          if(angular.isDefined(routes[i].objectName) && angular.isDefined(routeOptions[routes[i].objectName])) {
            // console.log(routeOptions[routes[i].objectName]);
            if(angular.isObject(routeOptions[routes[i].objectName].resolve)) {
              options.resolve = routeOptions[routes[i].objectName].resolve;
            }
            if(angular.isObject(routeOptions[routes[i].objectName].views)) {
              options.views = routeOptions[routes[i].objectName].views;
            }
            
          } else {
            console.error("objectName "+routes[i].objectName+" not found for route "+routes[i]);
          } 
        }
        // If options are set, init state
        if(angular.isDefined(options.url) && angular.isDefined(options.views)) {
          // console.log("New Route", routes[i].state.name, options);
          $stateProvider.state(routes[i].state.name, options);
        }
        //set alternative urls as redirects
        if(angular.isArray(routes[i].alternativeUrls)) {
          for (var a = 0; a < routes[i].alternativeUrls.length; a++) {
            // e.g. $urlRouterProvider.when('/referenzen', '/referenzen/uebersicht');
            // console.log("New redirect: "+routes[i].alternativeUrls[a]+" -> "+routes[i].url);
            $urlRouterProvider.when(routes[i].alternativeUrls[a], routes[i].url);
          }
        }
      } else {
        // if route is not a main route
        // if(typeof(routes[i].url) === 'string' && routes[i].url.length > 0) {
        //   options.url = routes[i].url;
        //   $urlRouterProvider.when(routes[i].alternativeUrls[a], routes[i].url);
        // }
        
      }
    }
  };


  this.$get = function jlRoutesFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlRoutes();
  };
})
.filter('showOnlyMainRoutes', function() {
  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(routes, active) {
    if(active !== true) {
      return routes;
    }
    var result = [];
    for (var i = 0; i < routes.length; i++) {
      if(routes[i].main === true) {
        result.push(routes[i]);
      }
    }
    return result;
  };
})
.service('RoutesService', function ($rootScope, JLSailsService, $log, SortableService, UtilityService) {

  var create = function(data) {
    $log.debug("[RoutesService.create] data", data);
    if(!angular.isObject(data)) {
      data = {};
    }
    if(!angular.isString(data.match)) {
      data.match = "";
    }
    if(!angular.isString(data.title)) {
      data.title = "";
    }
    if(data.main !== true && data.main !== false) {
      data.main = false;
    }
    if(!angular.isString(data.url)) {
      data.url = "";
    }
    if(!angular.isArray(data.alternativeUrls)) {
      data.alternativeUrls = [];
    }
    if(angular.isUndefined(data.state) || !angular.isObject(data.state)) {
      data.state = {};
    }
    if(!angular.isString(data.state.name)) {
      data.state.name = "";
    }
    if(data.state.customstate !== true && data.state.customstate !== false) {
      data.state.customstate = false;
    }
    if(!angular.isString(data.state.url)) {
      data.state.url = "";
    }
    if(!angular.isString(data.state.views)) {
      data.state.views = "";
    }
    if(!angular.isString(data.state.resolve)) {
      data.state.resolve = "";
    }
    if(!angular.isObject(data.fallback)) {
      data.fallback = {};
    }
    if(!angular.isString(data.fallback.url)) {
      data.fallback.url = "";
    }
    return data;
  };

  var append = function(routes, data, callback) {
    $log.debug("[RoutesService] data before", data);
    data = create(data);
    $log.debug("[RoutesService] data after", data);
    SortableService.append(routes, data, callback);
  };

  var swap = function(routes, index_1, index_2, callback) {
    return SortableService.swap(contents, index_1, index_2, callback);
  };

  var moveForward = function(index, routes, callback) {
    return SortableService.moveForward(index, routes, callback);
  };

  var moveBackward = function(index, routes, callback) {
    return SortableService.moveBackward(index, routes, callback);
  };

  var removeFromClient = function (routes, index, route, callback) {
    if(angular.isFunction(callback)) {
      return SortableService.remove(routes, index, route, callback);
    }
    return SortableService.remove(routes, index, route);
  };

  var remove = function(routes, index, route, callback) {
    if((angular.isUndefined(route) || route === null) && angular.isDefined(index)) {
      route = routes[index];
    }
    if(angular.isUndefined(index) || index === null) {
      index = routes.indexOf(route);
    }
    routes = removeFromClient(routes, index, route);
    // if route has an id it is saved on database, if not, not
    if(route.id) {
      $log.debug("[RoutesService.remove] remove from server, too", route);
      var options = {
        method: 'delete',
        resultIsArray: false
      };
      return JLSailsService.resolve('/routes/destroy/'+route.id, {id:route.id}, options, callback);
    }
  };

  var find = function(query, callback) {
    // $log.debug("[RoutesService.find]");
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/routes/find', query, options, callback);
  };

  var findOne = function(query, callback) {
    // $log.debug("[RoutesService.find]");
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/routes/findOne', query, options, callback);
  };


  /**
   * For superadminsd
   */
  var findByHost = function(query, callback) {
    // $log.debug("[RoutesService.findByHost]");
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/findByHost', query, options, callback);
  };

  var updateOrCreate = function(route, callback) {
    $log.debug("[RoutesService.updateOrCreate]", route);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/Routes/updateOrCreate', {route: route}, options, callback);
  };

  var updateOrCreateByHost = function(host, route, callback) {
    $log.debug("[RoutesService.updateOrCreateByHost]", host, route);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/Routes/updateOrCreateByHost', {host: host, route: route}, options, callback);
  };

  var updateOrCreateEach = function(routes, callback) {
    $log.debug("[RoutesService.updateOrCreateEach]", routes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/updateOrCreateEach', {routes: routes}, options, callback);
  };

  var updateOrCreateEachByHost = function(host, routes, callback) {
    $log.debug("[RoutesService.updateOrCreateEachByHost]", host, routes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/updateOrCreateEachByHost', {host: host, routes: routes}, options, callback);
  };

  var generateObjectnameFromStatename = function (statename) {
    $log.debug("[RoutesController.generateObjectnameFromStatename]", statename);
    var objectname = "";
    var keys = statename.split('.');
    for (var k = 0; k < keys.length; k++) {
      objectname += UtilityService.capitalizeFirstLetter(keys[k]);
    }
    objectname = UtilityService.lowercaseFirstLetter(objectname);
    return objectname;
  };

  var generateObjectnameFromUrl = function (url) {
    var objectname = "";
    var keys = url.split('/');
    for (var k = 0; k < keys.length; k++) {
      objectname += UtilityService.capitalizeFirstLetter(keys[k]);
    }
    objectname = UtilityService.lowercaseFirstLetter(objectname);
    $log.debug("[RoutesController.generateObjectnameFromUrl]", url, keys, objectname, objectname.length);
    return objectname;
  };

  return {
    create: create,
    append: append,
    swap: swap,
    moveForward: moveForward,
    moveBackward: moveBackward,
    removeFromClient: removeFromClient,
    remove: remove,
    destroy: remove, // Alias
    find: find,
    findOne: findOne,
    findByHost: findByHost,
    updateOrCreate: updateOrCreate,
    updateOrCreateByHost: updateOrCreateByHost,
    updateOrCreateEach: updateOrCreateEach,
    updateOrCreateEachByHost: updateOrCreateEachByHost,
    saveEachByHost: updateOrCreateEachByHost, // Alias
    generateObjectnameFromStatename: generateObjectnameFromStatename,
    generateObjectnameFromUrl: generateObjectnameFromUrl,
  };
});
angular.module('jumplink.cms.sails', [
    'sails.io',
  ])

  .service('JLSailsService', function ($rootScope, $sailsSocket, $q, $log) {

    var resolve = function(url, query, options, callback, next) {
      var deferred = $q.defer();
      var errors = [
        "On trying to resolve "+url,
        "Request has more than one results",
        "No result"
      ];
      if(angular.isUndefined(options)) {
        options = {};
      }
      if(angular.isUndefined(options.method)) {
        options.method = 'get';
      }
      if(angular.isUndefined(options.resultIsArray)) {
        options.resultIsArray = false;
      }
      if(angular.isUndefined(query)) {
        query = {};
      }
      // $log.debug("[JLSailsService.resolve]", url, query, options);
      $sailsSocket[options.method](url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          if(angular.isFunction(callback)) {
            return callback(null, null);
          }
          return deferred.resolve(null);
        }
        if (!options.resultIsArray && angular.isArray(data.data)) {
          data.data = data.data[0];
          $log.warn(errors[1]);
        }
        // data.data.content = html_beautify(data.data.content);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          callback(null, data.data);
        }
        return deferred.resolve(data.data);
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return deferred.reject(errors[0]);
      });
      return deferred.promise;
    };
    return {
      resolve: resolve
    };
  })
;
angular.module('jumplink.cms.session', [
  'sails.io',
  'jumplink.cms.sails'
])
.service('SessionService', function ($rootScope, JLSailsService, $sailsSocket, $q, $log) {

  var create = function(user, callback) {
    $log.debug("[SessionService.create]", user);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/session/create', user, options, callback);
  };

  var destroy = function(user, callback) {
    $log.debug("[SessionService.destroy]", user);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/session/destroy', user, options, callback);
  };

  /**
   * Check if user is authentication in current cms session
   * Used if you need authentication conditions
   */
  var isAuthenticated = function (callback) {
    $log.log("[SessionService.isauthenticated]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/authenticated').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Used for routes you can only visit if you are signed in, throws an error message if your are not authenticated
   */
  var needToBeAuthenticated = function () {
    $log.log("[SessionService.needToBeAuthenticated] authenticated");
    var deferred = $q.defer();
    $sailsSocket.get('/session/authenticated').then (function (data) {
      if (data.data) {
        $log.log("is authenticated", data);
        return deferred.resolve(data.data);
      } else {
        $log.log("is not authenticated", data);
        return deferred.reject('You need to be logged in');
      }
    });
    return deferred.promise;
  };

  /**
   * Check if authentifcated user is blogger or better
   */
  var bloggerOrBetter = function (callback) {
    $log.log("[SessionService.bloggerOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/bloggerOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if cms is in developer mode or session user is better than that
   */
  var developerOrBetter = function (callback) {
    $log.log("[SessionService.developerOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/developerOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is siteadmin or better
   */
  var siteadminOrBetter = function (callback) {
    $log.log("[SessionService.siteadminOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/siteadminOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is superadmin
   */
  var superadmin = function (callback) {
    $log.log("[SessionService.superadmin]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/superadmin').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is an employee
   */
  var employee = function (callback) {
    $log.log("[SessionService.employee]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/employee').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is an employee or better
   */
  var employeeOrBetter = function (callback) {
    $log.log("[SessionService.employee]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/employeeOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Used for routes you can only visit if you are signed in and user employee or better, throws an error message if your are not employee or better
   */
  var needToBeEmployeeOrBetter = function (callback) {
    $log.log("[SessionService.authenticated] authenticated");
    var deferred = $q.defer();
    $sailsSocket.get('/session/employeeOrBetter').then (function (data) {
      if (data.data) {
        $log.log("is employeeOrBetter", data);
        return deferred.resolve(data.data);
      } else {
        $log.log("is not employeeOrBetter", data);
        return deferred.reject('You must be an employee or a user with more credentials to do that');
      }
    });
    return deferred.promise;
  };

  /**
   * Used for routes you can only visit if you are signed in and user is admin or better, throws an error message if your are not employee or better
   */
  var needToBeSiteadminOrBetter = function (callback) {
    $log.log("[SessionService.authenticated] authenticated");
    var deferred = $q.defer();
    $sailsSocket.get('/session/siteadminOrBetter').then (function (data) {
      if (data.data) {
        $log.log("is siteadminOrBetter", data);
        return deferred.resolve(data.data);
      } else {
        $log.log("is not employeeOrBetter", data);
        return deferred.reject('You must be an admin or a user with more credentials to do that');
      }
    });
    return deferred.promise;
  };
  /**
   * 
   */
  var getAllPolicies = function (callback) {
    $log.log("[SessionService.getAllPolicies]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/getAllPolicies').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Get logged in user
   */
  var getUser = function (callback) {
    $log.log("[SessionService.getUser]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/getUser').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  return {
    create: create,
    destroy: destroy,
    authenticated: needToBeAuthenticated, //alias TODO remove
    needToBeAuthenticated: needToBeAuthenticated,
    isAuthenticated: isAuthenticated, // TODO rename to authenticated
    bloggerOrBetter: bloggerOrBetter,
    developerOrBetter: developerOrBetter,
    siteadminOrBetter: siteadminOrBetter,
    superadmin: superadmin,
    employee: employee,
    employeeOrBetter: employeeOrBetter,
    needToBeEmployeeOrBetter: needToBeEmployeeOrBetter,
    needToBeSiteadminOrBetter: needToBeSiteadminOrBetter,
    getAllPolicies: getAllPolicies,
    getUser: getUser
  };
});
angular.module('jumplink.cms.sidebar', [
    'mgcrea.ngStrap.aside',
  ])

  .directive('jlSidebar', function ($compile, $window) {

    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: '/views/modern/sidebar.jade',
      scope: {
        routes: "=",
        title: "=" 
      },
      link: function ($scope, $element, $attrs) {
        
      }
    };
  });
angular.module('jumplink.cms.bootstrap.signin', [
    'mgcrea.ngStrap',
    'jumplink.cms.signin'
  ])

  .service('SigninBootstrapService', function ($rootScope, SigninService, $log, $modal) {
    var siginWithModal = function(title, goBackAfterSignin, extendRoles, scope, callback) {
      $log.debug("[SigninBootstrapService.siginWithModal]", title, goBackAfterSignin, extendRoles);

      if(angular.isFunction(goBackAfterSignin) && !angular.isFunction(callback)) {
        callback = goBackAfterSignin;
        goBackAfterSignin = false;
      }

      if(angular.isFunction(extendRoles) && !angular.isFunction(callback)) {
        callback = extendRoles;
        extendRoles = false;
      }

      if(angular.isFunction(scope) && !angular.isFunction(callback)) {
        callback = scope;
        scope = null;
      }

      var signinModal = $modal({title: title, templateUrl: '/views/modern/signin.bootstrap.modal.jade', show: false});
      signinModal.$scope.aborted = false;
      signinModal.$scope.result = null;
      signinModal.$scope.user = {
        email: "",
        password: ""
      };
      // signinModal.$scope.goBackAfterSignin = goBackAfterSignin === true;

      signinModal.$scope.abort = function (user) {
        signinModal.$scope.aborted = true;
      };

      signinModal.$scope.signin = function (user) {
        $log.debug("[SigninBootstrapService.siginWithModal.signin]", user);
        SigninService.signin(user, goBackAfterSignin, extendRoles, scope, function (error, result) {
          if(error) {
            signinModal.$scope.error = error;
            return signinModal.$scope.error;
          }
          signinModal.$scope.result = result;
          // $rootScope.
          $log.debug(result);
        });
      };

      signinModal.$scope.$on('modal.hide',function(){
        $log.debug("signin modal closed");
        if(angular.isFunction(callback)) {
          callback(signinModal.$scope.error, signinModal.$scope.result, signinModal.$scope.user);
        }
      });

      signinModal.$promise.then(signinModal.show);
    };

    return {
      siginWithModal: siginWithModal
    };
  })
;
angular.module('jumplink.cms.signin', [
  'jumplink.cms.session',
  'jumplink.cms.history',
  'ngAsync'
])
.service('SigninService', function (SessionService, $log, HistoryService, $async) {


  var getRoles = function (scope, callback) {
    $async.parallel({
      authenticated: function(callback) {
        SessionService.isAuthenticated(callback);
      },
      bloggerOrBetter: function(callback) {
        SessionService.bloggerOrBetter(callback);
      },
      siteadminOrBetter: function(callback) {
        SessionService.siteadminOrBetter(callback);
      },
      employeeOrBetter: function(callback) {
        SessionService.employeeOrBetter(callback);
      }
    },
    callback);
  };

  var signin = function (user, goBackAfterSignin, extendRoles, scope, callback) {
    if(angular.isFunction(goBackAfterSignin) && !angular.isFunction(callback)) {
      callback = goBackAfterSignin;
      goBackAfterSignin = false;
    }

    if(angular.isFunction(extendRoles) && !angular.isFunction(callback)) {
      callback = extendRoles;
      extendRoles = false;
    }

    if(angular.isFunction(scope) && !angular.isFunction(callback)) {
      callback = scope;
      scope = null;
    }

    $log.debug("[SigninService.signin]", user);
    // $scope.user.role = 'superadmin';
    SessionService.create(user, function (err, result) {
      if(err) {
        return callback(err);
      }
      if(!result.authenticated) {
        return null;
      }
      if(extendRoles === true) {
        SessionService.getAllPolicies(function (err, results) {
          if(err) {
            return callback(err);
          }
          $log.debug("scope before extend", scope);
          angular.extend(scope, results);
          $log.debug("scope after extend", scope);
          if(goBackAfterSignin === true) {
            HistoryService.back();
          }
        });
      }
      if(goBackAfterSignin === true) {
        HistoryService.back();
      }

      $log.debug("[SigninService.signin]", user);
      $log.debug("[SigninService.signin] err result", err, result);
      return callback(null, result);
    });
  };
  return {
    signin: signin
  };
});
angular.module('jumplink.cms.sortable', [
    'jumplink.cms.utilities'
  ])
  .service('SortableService', function (UtilityService, $log) {
    var resetPosition = function (array) {
      for (var i = array.length - 1; i >= 0; i--) {
        array[i].position = i+1;
      }
      return array;
    };

    /*
     * Swap two elements within the object array (called objects) and adjust the position
     */
    var swap = function(objects, index_1, index_2, cb) {

      var object_1 = objects[index_1];
      var object_2 = objects[index_2];

      // swap position too
      var position_tmp = object_1.position;
      object_1.position = object_2.position;
      object_2.position = position_tmp;

      // IMPORTANT: swap Indexes, too
      objects[index_1] = object_2;
      objects[index_2] = object_1;

      if(angular.isFunction(cb)) {
        return cb(null, objects);
      }
      return objects;
    };

    /*
     * Insert new object to position and move the underlying objects one index back
     * http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
     */
    var move = function (array, old_index, new_index, cb) {
      $log.debug("[SortableService] move");

      if (new_index >= array.length) {
          var k = new_index - array.length;
          while ((k--) + 1) {
              array.push(undefined);
          }
      }
      array.splice(new_index, 0, array.splice(old_index, 1)[0]);

      array = resetPosition(array);

      if(angular.isFunction(cb)) {
        cb(null, array);
      }
      return array;
    };

    /*
     * Append a new object to array, check unique key value if set
     */
    var append = function(objects, data, cb, unique, uniqueKey) {
      $log.debug("[SortableService.append] data", data);
      var errors = [
        "Unique key '"+uniqueKey+"' already exist"
      ];
      var new_index = objects.length;
      var new_position = 1;
      var new_object;
      var uniqueIndex = -1;

      var okay = function (new_object, objects, new_index, cb) {
        // $log.debug("old objects", objects);
        objects.push(new_object);
        // $log.debug("new objects", objects);
        if(angular.isFunction(cb)) {
          return cb(null, objects, new_index);
        }
        return objects;
      };

      var error = function (error, objects, uniqueIndex, cb) {
        if(angular.isFunction(cb)) {
          return cb(error, objects, uniqueIndex);
        }
        return error;
      };

      if(new_index >= 1) {
        new_position = objects[new_index-1].position+1;
      }

      new_object = {
        position: new_position,
      };

      new_object = angular.extend(new_object, data);
      $log.debug("[SortableService.append] new_object", new_object);

      if(unique && new_object[uniqueKey]) {
        uniqueIndex = UtilityService.findKeyValue(objects, uniqueKey, new_object[uniqueKey]);
        if(uniqueIndex > -1) {
          return error(errors[0], objects, uniqueIndex, cb);
        } else {
          return okay(new_object, objects, new_index, cb);
        }
      } else {
        return okay(new_object, objects, new_index, cb);
      }
    };

    /*
     * removed object from an array and adds it in another
     */
    var moveObjectToAnotherArray = function(object, index_from, array_from, array_to, cb, replaceData) {
      var errors = [
        "[SortableService] Error: Function parameters not correctly set"
      ];

      var errorParamsNotSet = function () {
        $log.error(errors[0], object, index_from, array_from, array_to);
        return cb(errors[0]);
      };

      if(object === null) {
        object = array_from[index_from];
      } else if (index_from === null) {
        index_from = array_from.indexOf(object);
      } else {
        errorParamsNotSet();
      }

      if(!angular.isArray(array_from) || !angular.isArray(array_to)) {
        errorParamsNotSet();
      }

      append(array_to, object, function (err, array_to, index_to) {
        if(err) {
          return cb(err);
        }
        remove(array_from, index_from, object, function (err, array_from) {
          if(err) {
            return cb(err);
          }
          return cb(null, {index_from: index_from, array_from: array_from, index_to:index_to, array_to: array_to });
        });
      }, false );
    };

    var moveForward = function(index, objects, cb) {
      if(index + 1 < objects.length ) {
        return swap(objects, index, index+1, cb);
      }
      if(angular.isFunction(cb)) {
        return cb("Can't move forward, index is the last element.", objects);
      }
      return objects;
    };

    var moveBackward = function(index, objects, cb) {
      if(index - 1 >= 0) {
        return swap(objects, index, index-1, cb);
      }
      if(angular.isFunction(cb)) {
        return cb("Can't move backward, index is the first element.", objects);
      }
      return objects;
    };

    var remove = function (objects, index, object, cb) {
      if(typeof(index) === 'undefined' || index === null) {
        index = objects.indexOf(object);
      }
      // $log.debug("remove from client", index, object);
      if (index > -1) {
        objects.splice(index, 1);
      }
      if(angular.isFunction(cb)) {
        return cb(null, objects);
      }
      return objects;
    };

    /*
     * find value by key in array
     */
    var findKeyValue = function (objects, key, value) {
      // $log.debug("findKeyValue", key, value);
      var index = -1;
      for (var i = objects.length - 1; i >= 0 && index <= -1; i--) {
        if(objects[i][key] === value) {
          index = i;
        } 
      }
      return index;
    };

    /*
     * Function for Drag and Drop functionality.
     * Moves an moveable element with the moveFunction (e.g. to swap or insert the obkect).
     * Usually called when the mouse button is released over an existing moveable element.
     */
    var dropMove = function(objects, dropObjectIndex, dragObject, event, cb, moveFunction) {
      if(!moveFunction) {
        moveFunction = move; // swap | move
      }
      var dragObjectIndex = objects.indexOf(dragObject);
      var dropObject = objects[dropObjectIndex];
      $log.debug("[SortableService] dropMove, dragObject:", dragObject, "dragObjectIndex", dragObjectIndex, "dropObject", dropObject, "dropObjectIndex", dropObjectIndex);
      return moveFunction(objects, dragObjectIndex, dropObjectIndex, cb);
    };

    return {
      resetPosition: resetPosition,
      swap: swap,
      moveObjectToAnotherArray: moveObjectToAnotherArray,
      move: move,
      moveForward: moveForward,
      moveBackward: moveBackward,
      remove: remove,
      append: append,
      dropMove: dropMove,
    };
  })

;
angular.module('jumplink.cms.subnavigation', [
  'mgcrea.ngStrap',
  'sails.io',
  'jumplink.cms.sortable',
  'ngFocus',
  'jumplink.cms.utilities'
])

.service('SubnavigationService', function ($rootScope, $window, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {

  var editModal = null;

  var setEditModal = function($scope) {
    editModal = $modal({scope: $scope, title: 'Navigation bearbeiten', templateUrl: '/views/modern/editsubnavigationmodal.jade', show: false});
    return getEditModal();
  };

  var getEditModal = function() {
    return editModal;
  };

  var subscribe = function() {
    // called on content changes
    $sailsSocket.subscribe('navigation', function(msg){
      $log.debug("[SubnavigationService] Navigation event!", msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Navigation wurde aktualisiert', msg.id);
          }
        break;
      }
    });
  };

  // WORKAROUND wait until image is loaded to fix bs-sidebar
  var resizeOnImagesLoaded = function () {
    angular.element($window).imagesLoaded(function() {
      angular.element($window).triggerHandler('resize');
    });
  };

  var create = function(data) {
    if(!data || !data.target) {
      data.target = "";
    }
    if(!data || !data.name) {
      data.name = "";
    }
    if(!data || !data.page) {
      cb("Page not set.");
    }
    return data;
  };

  var append = function(navs, data, cb) {

    data = create(data);

    // $log.debug("[SubnavigationService] data", data);

    SortableService.append(navs, data, cb);
  };

  var swap = function(navs, index_1, index_2, cb) {
    return SortableService.swap(contents, index_1, index_2, cb);
  };

  var moveForward = function(index, navs, cb) {
    return SortableService.moveForward(index, navs, cb);
  };

  var moveBackward = function(index, navs, cb) {
    return SortableService.moveBackward(index, navs, cb);
  };

  var edit = function(navs, cb) {
    // $log.debug("[SubnavigationService] edit subnavigations", navs);
    editModal.$scope.navs = navs;
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);

    if(angular.isDefined(editModal.$scope.navs) && editModal.$scope.navs.length > 0) {
      var index = Number(editModal.$scope.navs.length-1);
      // $log.debug("[SubnavigationService] focus last subnavigationeditname", index);
      focus('subnavigationeditname'+index);
    }

    editModal.$scope.$on('modal.hide',function(){
      // $log.debug("[SubnavigationService] edit navigation modal closed");
      cb(null, editModal.$scope.navs);
    });
  };

  var removeFromClient = function (navs, index, nav, cb) {
    if(angular.isFunction(cb)) {
      return SortableService.remove(navs, index, nav, cb);
    }
    return SortableService.remove(navs, index, nav);
  };

  var remove = function(navs, index, nav, page, cb) {

    if((angular.isUndefined(nav) || nav === null) && angular.isDefined(index)) {
      nav = navs[index];
    }

    if(angular.isUndefined(index) || index === null) {
      index = navs.indexOf(nav);
    }

    navs = removeFromClient(navs, index, nav);
    // if nav has an id it is saved on database, if not, not
    if(nav.id) {
      $log.debug("[SubnavigationService] remove from server, too" ,nav);
      $sailsSocket.delete('/navigation/'+nav.id+"?page="+page, {id:nav.id, page: page}).success(function(data, status, headers, config) {
        if(angular.isFunction(cb)) {
          return cb(null, navs);
        }
      }).
      error(function(data, status, headers, config) {
        $log.error (errors[0], data);
        if(angular.isFunction(cb)) {
          return cb(data);
        }
      });
    }
  };

  var removeByTarget = function (navs, target, page, cb) {
    $log.debug("[SubnavigationService] remove subnavigation by target "+target);
    var index = UtilityService.findKeyValue(navs, 'target', target);
    if(index > -1) {
      $log.debug("[SubnavigationService] subnavigation found "+index);
      remove(navs, index, null, page, cb);
    } else {
      if(angular.isFunction(cb)) {
        cb("Subnavigation not found");
      }
    }
  };

  var fix = function(fixed, object, index, cb) {
    if(angular.isDefined(object.name) && angular.isString(object.name) && object.name !== "") {
      fixed.push(object);
    } else {
      $log.warn("Name not set, remove Subnavigation");
    }
    if(angular.isFunction(cb)) {
      return cb(null, fixed);
    }
    return fixed;
  };

  var fixEach = function(objects, cb) {
    var fixed = [];
    for (var i = objects.length - 1; i >= 0; i--) {
      fixed = fix(fixed, objects[i], i);
    }
    if(angular.isFunction(cb)) {
      return cb(null, fixed);
    }
    return fixed;
  };

  var save = function(navs, page, cb) {
    fixEach(navs, function(err, navs) {
      $sailsSocket.put('/navigation/replaceall', {navs: navs, page: page}).success(function(data, status, headers, config) {
        if(data !== null && typeof(data) !== "undefined") {
          // WORKAROUND until socket event works
          navs = $filter('orderBy')(data, 'position');
          if(angular.isFunction(cb)) {
            cb(null, navs);
          }
        } else {
          var err = 'Navigation konnte nicht gespeichert werden';
          $rootScope.pop('error', err, "");
          if(angular.isFunction(cb)) {
            cb(err, navs);
          } 
        }
      });
    });
  };

  var resolve = function(page) {
    var statename = 'layout.gallery';
    return $sailsSocket.get('/navigation?page='+page, {page: page}).then (function (data) {
      if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
        $log.warn("Warn: On trying to resolve "+page+" navs!", "Not found, navigation is empty!");
        return null;
      }
      data.data = $filter('orderBy')(data.data, 'position');
      $log.debug("[SubnavigationService]", data);
      return data.data;
    }, function error (resp){
      $log.error("[SubnavigationService] Error: On trying to resolve "+page+" navs!", resp);
    });
  };

  return {
    resizeOnImagesLoaded: resizeOnImagesLoaded,
    subscribe: subscribe,
    setEditModal: setEditModal,
    getEditModal: getEditModal,
    create: create,
    append: append,
    add: append,
    swap: swap,
    moveForward: moveForward,
    moveBackward: moveBackward,
    edit: edit,
    removeFromClient: removeFromClient,
    remove: remove,
    removeByTarget: removeByTarget,
    save: save,
    resolve: resolve
  };
});
angular.module('jumplink.cms.theme', [
  'sails.io',
  'ngAsync',
  'jumplink.cms.sails',
])

.service('ThemeService', function ($rootScope, $sailsSocket, $log, $async, JLSailsService) {
  var isSubscribed = false;

  /**
   * find themes for current host from database and isert priority from database (or from local.json if no priority is set).
   * @see CMS.ThemesController.find
   */
  var find = function(query, callback) {
    $log.debug("[ThemeService.find]", query);
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/theme/find', query, options, callback);
  };

  /**
   * find themes for any host from database and isert priority from database (or from local.json if no priority is set).
   * Only for superadmins!
   */
  var findByHost = function(host, callback) {
    // $log.debug("[ThemeService.findByHost]", host);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/theme/findbyhost', {host: host}, options, callback);
  };

  var save = function (themes, callback) {
    updateOrCreateEach(themes, function (err, result) {
      if(angular.isDefined(callback)) {
        callback(err, result);
      }
    });
  };
  
  var updateOrCreateEach = function(themes, callback) {
    $log.debug("[ThemeService.updateOrCreateEach]", themes);
    // $sailsSocket.put('/Theme/updateOrCreateEach', {themes: themes}).success(function(data, status, headers, config) {
    //   $log.debug(data, status, headers, config);
    //   callback(data, status, headers, config)
    // });
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Theme/updateOrCreateEach', {themes: themes}, options, callback);
  };

  var updateOrCreateEachByHost = function(host, themes, callback) {
    // $log.debug("[ThemeService.updateOrCreateEachByHost]", host, themes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Theme/updateOrCreateEachByHost', {host: host, themes: themes}, options, callback);
  };

  // TODO
  var subscribe = function () {
    if(!isSubscribed) {
      $sailsSocket.subscribe('theme', function(msg){
        if($rootScope.authenticated) {
          $log.debug(msg);
        }
        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurdne aktualisiert', msg.data);
            }
          break;
          case 'created':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden erstellt', msg.data);
            }
          break;
          case 'removedFrom':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden entfernt', "");
            }
          break;
          case 'destroyed':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden gelöscht', "");
            }
          break;
          case 'addedTo':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden hinzugefügt', "");
            }
          break;
        }
      });
      isSubscribed = true;
    }
  };

  return {
    find: find,
    findByHost: findByHost,
    save: save,
    updateOrCreateEach: updateOrCreateEach,
    updateOrCreateEachByHost: updateOrCreateEachByHost,
    subscribe: subscribe
  };
});
angular.module('jumplink.cms.toolbar', [
  'FBAngular'
])
.directive('jlToolbar', function ($compile, $window) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/toolbar.jade',
    scope: {
      routes: "=",
      title: "=",
      shorttitle: "=",
      fluid: "=",
      position: "=",
      filter: "=", 
    },
    link: function ($scope, $element, $attrs) {

    },
    controller: function ($scope, $log, Fullscreen) {
      $scope.fullscreenIsSupported = Fullscreen.isSupported();
      $scope.isFullscreen = false;
      $log.debug("[jumplink.cms.toolbar.jlToolbar.controller]", $scope);
      Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
        $scope.isFullscreen = isFullscreenEnabled === true;
        // $scope.$apply();
      });

      $scope.toggleFullscreen = function () {
        if (Fullscreen.isEnabled()) {
          Fullscreen.cancel();
        } else {
          Fullscreen.all();
        }
      };
    }
  };
});
angular.module('jumplink.cms.user', [
    'sails.io',
    'jumplink.cms.sails',
  ])

  .service('UserService', function ($rootScope, $sailsSocket, $log, JLSailsService) {
    var isSubscribed = false;

    var save = function(user, callback) {
      if(!angular.isString(user.role)) {
        user.role = "siteadmin";
      }
      
      // update user
      if(angular.isDefined(user.id)) {
        $log.debug("update user: sailsSocket.put('/user/"+user.id+"..'");
        $sailsSocket.put('/user/'+user.id, user).success(function(data, status, headers, config) {
          $log.debug(data, status, headers, config);
          if(angular.isDefined(data) && angular.isDefined(data.password)) {
            delete data.password;
          }
          callback(null, data, status, headers, config);
        });
      } else {
        // create user
        $log.debug("create user: sailsSocket.post('/user..");
        $sailsSocket.post('/user', user).success(function(data, status, headers, config) {
          // TODO FIXME data ist not the request result ?!
          $log.debug("data", data, "status", status, "headers", headers, "config", config);
          if(angular.isDefined(data) && angular.isDefined(data.password)) {
            delete data.password;
          }
          callback(null, data, status, headers, config);
        });
      }
    };

    var subscribe = function () {
      if(!isSubscribed) {
        $sailsSocket.subscribe('user', function(msg){
          if($rootScope.authenticated) {
            $log.debug(msg);
          }
          switch(msg.verb) {
            case 'updated':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde aktualisiert', msg.data.name);
              }
            break;
            case 'created':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde erstellt', msg.data.name);
              }
            break;
            case 'removedFrom':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde entfernt', "");
              }
            break;
            case 'destroyed':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde gelöscht', "");
              }
            break;
            case 'addedTo':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde hinzugefügt', "");
              }
            break;
          }
        });
        isSubscribed = true;
      }
    };

    var removeFromClient = function (users, user) {
      var index = users.indexOf(user);
      $log.debug("removeFromClient", user, index);
      if (index > -1) {
        users.splice(index, 1);
      }
    };

    var remove = function(users, user) {
      $log.debug("$scope.remove", user);
      if($rootScope.authenticated) {
        if(users.length <= 1) {
          $log.error('Der letzte Benutzer kann nicht gelöscht werden.');
        } else {
          removeFromClient(users, user);
          if(user.id) {
            $sailsSocket.delete('/user/'+user.id, {id:user.id}).success(function(data, status, headers, config) {
              $log.debug("user delete request", data, status, headers, config);
            });
          }
        }
      }
    };

    /**
     * find users for any host from database and isert priority from database (or from local.json if no priority is set).
     * Only for superadmins!
     */
    var findByHost = function(host, callback) {
      // $log.debug("[ThemeService.findByHost]", host);
      var options = {
        method: 'post',
        resultIsArray: true
      };
      return JLSailsService.resolve('/user/findbyhost', {host: host}, options, callback);
    };

    var updateOrCreateByHost = function(host, user, callback) {
      $log.debug("[UserService.updateOrCreateByHost]", host, routes);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/user/updateOrCreateByHost', {host: host, user: user}, options, callback);
    };

    return {
      save: save,
      subscribe: subscribe,
      remove: remove,
      findByHost: findByHost,
      updateOrCreateByHost: updateOrCreateByHost
    };
  })
;
angular.module('jumplink.cms.utilities', [
  ])
  .service('UtilityService', function ($log) {
    var invertOrder = function (array) {
      var result = [];
      for (var i = array.length - 1; i >= 0; i--) {
        result.push(array[i]);
      }
      return result;
    };

    /**
     * find value by key in array
     */
    var findKeyValue = function (objects, key, value) {
      // $log.debug("findKeyValue", key, value);
      var index = -1;
      for (var i = objects.length - 1; i >= 0 && index <= -1; i--) {
        if(objects[i][key] === value) {
          index = i;
        } 
      }
      return index;
    };

    /**
     * Capitalize the first character of a string, but not change the case of any of the other letters.
     *
     * @see http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
     */
    var capitalizeFirstLetter = function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    var lowercaseFirstLetter = function (string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    };

    return {
      invertOrder: invertOrder,
      findKeyValue: findKeyValue,
      capitalizeFirstLetter: capitalizeFirstLetter,
      lowercaseFirstLetter: lowercaseFirstLetter,
    };
  });
angular.module('jumplink.cms.bootstrap.validation', [
  'jumplink.cms.validation',
])
.provider('jlValidationBootstrap', function jlValidationBootstrapProvider(jlValidationProvider, $validationProvider) {
  this.setup = function () {
    $validationProvider.setErrorHTML(function (msg) {
      return "<span ng-show='form.name.$error.required' class='form-control-feedback'><i class='fa fa-exclamation-triangle'></i></span><label class=\"control-label has-error absolute-control-label-bottom\">" + msg + "</label>";
    });
    $validationProvider.setSuccessHTML(function (msg) {
      return "<span class='form-control-feedback'><i class='fa fa-check'></i></span><label class=\"control-label has-success absolute-control-label-bottom\">" + msg + "</label>";
    });
    angular.extend($validationProvider, {
      validCallback: function (element){
        $(element).parents('.form-group:first').removeClass('has-error').addClass('has-success');
      },
      invalidCallback: function (element) {
        $(element).parents('.form-group:first').removeClass('has-success').addClass('has-error');
      }
    });
  };
  this.getLocale = jlValidationProvider.getLocale;
  this.changeLocale = jlValidationProvider.changeLocale;
  this.$get = function jlValidationBootstrapFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlValidationBootstrap();
  };
});
angular.module('jumplink.cms.validation', [
  'validation',                               // https://github.com/huei90/angular-validation
  'validation.rule',                          // https://github.com/huei90/angular-validation
])
.provider('jlValidation', function jlValidationProvider($validationProvider) {
  this.getLocale = function () {
    var defaultMsg = {
      "minlength": $validationProvider.getDefaultMsg('minlength'),
      "maxlength": $validationProvider.getDefaultMsg('maxlength'),
      "required": $validationProvider.getDefaultMsg('required'),
      "email": $validationProvider.getDefaultMsg('email'),
      "number": $validationProvider.getDefaultMsg('number'),
      "url": $validationProvider.getDefaultMsg('url'),
    };
    return defaultMsg;
  };
  this.changeLocale = function (lang) {
    var defaultMsg = {};
    switch(lang) {
      case 'de':
        defaultMsg = {
          'minlength': {
            error: "Eingabe muss länger sein!",
            success: "Eingabe lang genug"
          },
          'maxlength': {
            error: "Eingabe muss kürzer sein!",
            success: "Eingabe kurz genug"
          },
          'required': {
            error: "Eine Eingabe ist erforderlich!",
            success: "Okay"
          },
          'email': {
            error: "Eingabe muss einer E-Mail entsprechen!",
            success: "Eingabe ist eine E-Mail"
          },
          'number': {
            error: "Eingabe darf nur Zahlen enthalten!",
            success: "Eingabe enthält nur Zahlen"
          },
          'url': {
            error: "Eingabe muss einer URL entsprechen!",
            success: "Eingabe entspricht einer URL"
          },
        };
      break;
      case 'en':
      break;
      default:
      break;
    }
    switch(lang) {
      case 'de':
        $validationProvider.setDefaultMsg(defaultMsg);
      break;
      case 'en':
        // do nothing
      break;
      default:
        // do nothing
      break;
    }
  };
  this.$get = function jlValidationFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlValidation();
  };
});
jumplink.cms = angular.module('jumplink.cms', [
  'ui.router',                 // AngularUI Router: https://github.com/angular-ui/ui-router
  'ngAnimate',               // ngAnimate: https://docs.angularjs.org/api/ngAnimate
  'ngSanitize',              // ngSanitize: https://docs.angularjs.org/api/ngSanitize
  'sails.io',                // angularSails: https://github.com/balderdashy/angularSails
  //, 'webodf',                  // custom module
  'FBAngular',               // angular-fullscreen: https://github.com/fabiobiondi/angular-fullscreen
  'mgcrea.ngStrap',          // AngularJS 1.2+ native directives for Bootstrap 3: http://mgcrea.github.io/angular-strap/
  'angularMoment',           // Angular.JS directive and filters for Moment.JS: https://github.com/urish/angular-moment
  // , 'wu.masonry',              // A directive to use masonry with AngularJS: http://passy.github.io/angular-masonry/
  'angular-carousel',        // An AngularJS carousel implementation optimised for mobile devices: https://github.com/revolunet/angular-carousel
  // , 'textAngular',             // A radically powerful Text-Editor/Wysiwyg editor for Angular.js: https://github.com/fraywing/textAngular
  'angular-medium-editor',   // AngularJS directive for Medium.com editor clone: https://github.com/thijsw/angular-medium-editor
  'ui.ace',                  // This directive allows you to add ACE editor elements: https://github.com/angular-ui/ui-ace
 // , 'leaflet-directive',       // AngularJS directive to embed an interact with maps managed by Leaflet library: https://github.com/tombatossals/angular-leaflet-directive
  'toaster',                 // AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  //, 'angularFileUpload',       // Angular File Upload is a module for the AngularJS framework: https://github.com/nervgh/angular-file-upload
  'angular-filters',         // Useful filters for AngularJS: https://github.com/niemyjski/angular-filters
  'ngDraggable',             // Drag and drop module for Angular JS: https://github.com/fatlinesofcode/ngDraggable
  'toggle-switch',           // AngularJS Toggle Switch: https://github.com/JumpLink/angular-toggle-switch
  'ngAsync',
  'ngFocus',
  'jumplink.cms.history',
  'jumplink.cms.content',
  'jumplink.cms.sortable',
  'jumplink.cms.utilities',
  'jumplink.cms.subnavigation',
  'jumplink.cms.info',
  'jumplink.cms.config',
  //, 'jumplink.cms.event',
  'jumplink.cms.user',
  'jumplink.cms.theme',
  //, 'jumplink.cms.gallery',
  'jumplink.cms.admin',
  'jumplink.cms.session',
  'jumplink.cms.multisite',
  'jumplink.cms.routes',
  'jumplink.cms.sidebar',
  'jumplink.cms.toolbar',
  'jumplink.cms.signin',
]);

jumplink.cms.run(function ($rootScope, $state, $window, $log) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $state.go('error.signin', {error: error});
  });
});

jumplink.cms.run(function(amMoment) {
  amMoment.changeLocale('en');
});

jumplink.cms.config( function($logProvider) {
  // see variables.jade environment variable
  $logProvider.debugEnabled(environment === 'development');
});
jumplink.cms.config( function(jlRoutesProvider) {

  var routeOptions = {};

  // use the HTML5 History API
  jlRoutesProvider.html5Mode(true);

  jlRoutesProvider.otherwise('/error/Request not found!');

  // LAYOUT
  jlRoutesProvider.state('layout', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    controller: 'LayoutController',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      sites: function(MultisiteService) {
        return MultisiteService.resolveNames({});
      },
      hosts: function(MultisiteService) {
        return MultisiteService.resolveHosts({});
      }
    },
  });

  routeOptions.layoutHome = {
    resolve: {},
    views: {
      'content' : {
        templateUrl: '/views/modern/home/home.jade',
        controller: 'HomeController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  };

  routeOptions.layoutThemes = {
    resolve: {},
    views: {
      'content' : {
        templateUrl: '/views/modern/themes/themes.jade',
        controller: 'ThemesController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  };

  routeOptions.layoutRoutes = {
    views: {
      'content' : {
        templateUrl: '/views/modern/routes/routes.jade',
        controller: 'RoutesController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  };

  routeOptions.layoutUsers = {
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/users.jade',
        controller: 'UsersController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  };

  jlRoutesProvider.state('layout.user', {
    url: '/user/:index',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      user: function($sailsSocket, $stateParams, $log) {
        return $sailsSocket.get('/user'+'/'+$stateParams.index).then (function (data) {
          delete data.data.password;
          return data.data;
        }, function error (resp){
          $log.error(resp);
        });
      }
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade',
        controller: 'UserController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  jlRoutesProvider.state('layout.new-user', {
    url: '/new/user',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      user: function() {
        return {

        };
      }
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade',
        controller: 'UserController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  routeOptions.layoutStatus = {
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      status: function(CmsService, $log) {
        $log.debug("start get cms info");
        return CmsService.infoAdmin();
      },
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/status/content.jade',
        controller: 'StatusController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
      'footer' : {
        templateUrl: '/views/modern/footer.jade',
        controller: 'FooterController'
      }
    },
  };

  // ERROR LAYOUT
  jlRoutesProvider.state('error', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    // controller: 'ErrorController',
  });

  jlRoutesProvider.state('error.signin', {
    url: '/error/:error',
    views: {
      'content' : {
        templateUrl: '/views/modern/error/error.jade',
        controller: 'ErrorController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
      'footer' : {
        templateUrl: '/views/modern/footer.jade',
        controller: 'FooterController'
      },
    }
  });

  jlRoutesProvider.setRoutes(routes, routeOptions);
});

jumplink.cms.run(function ($rootScope, $state, $window, $log) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $state.go('error.signin', {error: error});
  });
});

jumplink.cms.controller('AppController', function($rootScope, $scope, $state, $window, $timeout, Fullscreen, toaster, $sailsSocket, $location, HistoryService, $log) {

  // fix scroll to top on route change
  $scope.$on("$stateChangeSuccess", function () {
    HistoryService.autoScroll();
  });

  //AngularJS Toaster - AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  $rootScope.pop = function(type, title, body, timeout, bodyOutputType, clickHandler) {
    toaster.pop(type, title, body, timeout, bodyOutputType, clickHandler);
  };

  var generalSubscribes = function () {

    $sailsSocket.post('/session/subscribe', {}).success(function(data, status, headers, config){

      // react to subscripe from server: http://sailsjs.org/#/documentation/reference/websockets/sails.io.js/io.socket.on.html
      $sailsSocket.subscribe('connect', function(msg){
        $log.debug('socket.io is connected');
      });

      $sailsSocket.subscribe('disconnect', function(msg){
        $rootScope.pop('error', 'Verbindung zum Server verloren', "");
        $rootScope.authenticated = false;
      });

      $sailsSocket.subscribe('reconnect', function(msg){
        $rootScope.pop('info', 'Sie sind wieder mit dem Server verbunden', "");
      });
    });
  };

  var adminSubscribes = function() {
    // subscripe on server
    $sailsSocket.post('/session/subscribe', {}).success(function(data, status, headers, config){

      // called on any sended email from server
      $sailsSocket.subscribe('email', function(email){

        var body = ''+
          '<dl>'+
            '<dt>Absender</dt>'+
            '<dd><a href="mailto:'+email.from+'">'+email.from+'</a></dd>'+
            '<dt>Betreff</dt>'+
            '<dd>'+email.subject+'</dd>';
            if(email.attachments) {
              body += ''+
              '<dt>Anhänge</dt>'+
              '<dd>'+email.attachments.length+'</dd>';
            }
            body += ''+
          '</dl>';

        $rootScope.pop('info', 'Eine E-Mail wurde versendet.', body, null, 'trustedHtml');
      });

      // admin room
      $sailsSocket.subscribe('admins', function(msg){
        $log.debug(msg);
      });

    });
  };

  // http://stackoverflow.com/questions/18608161/angularjs-variable-set-in-ng-init-undefined-in-scope
  $rootScope.$watch('authenticated', function () {
    // $log.debug("authenticated: "+$rootScope.authenticated);
    if($rootScope.authenticated) {
      $rootScope.mainStyle = {'padding-bottom':'50px'};
      $rootScope.toasterPositionClass = 'toast-bottom-right-with-toolbar';
      adminSubscribes();
    } else {
      $rootScope.mainStyle = {'padding-bottom':'0px'};
      $rootScope.toasterPositionClass = 'toast-bottom-right';
    }
  });
  generalSubscribes();

  $rootScope.fullscreenIsSupported = Fullscreen.isSupported();
  $rootScope.isFullscreen = false;
  Fullscreen.$on('FBFullscreen.change', function (evt, isFullscreenEnabled) {
    $rootScope.isFullscreen = isFullscreenEnabled === true;
    $rootScope.$apply();
  });

  $rootScope.toggleFullscreen = function () {
    if (Fullscreen.isEnabled()) {
      Fullscreen.cancel();
    } else {
      Fullscreen.all();
    }
  };

  // TODO loading animation on $stateChangeStart
    $rootScope.$on('$stateChangeStart',
  function(event, toState, toParams, fromState, fromParams){
    // $rootScope.loadclass = 'loading'; // WORKAROUND comment because event is not always fired, see FIXME
  });

  // on new url
  $rootScope.$on('$stateChangeSuccess',
  function(event, toState, toParams, fromState, fromParams){
    $rootScope.loadclass = 'finish'; // FIXME this event is not always fired
    switch(toState.name) {
      case "layout.home":
        $rootScope.bodyclass = 'home';
      break;
      case "layout.gallery":
        $rootScope.bodyclass = 'gallery';
      break;
      case "layout.gallery-slider":
        $rootScope.bodyclass = 'gallery-slider';
      break;
      default:
        $rootScope.bodyclass = toState.name;
      break;
    }
  });

  $rootScope.getWindowDimensions = function () {
    return { 'height': angular.element($window).height(), 'width': angular.element($window).width() };
  };

  angular.element($window).bind('resize', function () {
    // $timeout(function(){
    //   $rootScope.$apply();
    // });
    // $rootScope.$apply();
  });

  // http://stackoverflow.com/questions/641857/javascript-window-resize-event
  if(angular.element($window).onresize) { // if jQuery is used
    angular.element($window).onresize = function(event) {
      $timeout(function(){
        $rootScope.$apply();
      });
    };
  }

  // http://stackoverflow.com/questions/22991481/window-orientationchange-event-in-angular
  angular.element($window).bind('orientationchange', function () {
    $timeout(function(){
      $rootScope.$apply();
    });
  });

  angular.element($window).bind('deviceorientation', function () {
    $timeout(function(){
      $rootScope.$apply();
    });
  });

  $rootScope.$watch($rootScope.getWindowDimensions, function (newValue, oldValue) {
    $rootScope.windowHeight = newValue.height;
    $rootScope.windowWidth = newValue.width;
    $timeout(function(){
      $rootScope.$apply();
    });
  }, true);

  $rootScope.logout = function() {
    $sailsSocket.post("/session/destroy", {}).success(function(data, status, headers, config) {
      $rootScope.authenticated = false;
      $rootScope.pop('success', 'Erfolgreich abgemeldet', "");
    });
  };

  $scope.goToState = $state.go;

});
jumplink.cms.controller('ErrorController', function($rootScope, $scope, $log, $stateParams, SessionService, SigninService, $state) {
  $scope.error = $stateParams.error;

  $scope.signin = function () {
    $log.debug($scope.user);
    // $scope.user.role = 'superadmin';
    SigninService.signin($scope.user, false, function (err, result) {
      if(err) {
        $scope.error = err;
        return err;
      }
      $state.go('layout.home');
      $log.debug(result);
    });
  };

  $scope.signin = function () {
    $log.debug("[SigninController.signin]", $scope.user);
    SigninService.signin($scope.user, false, function (err, result) {
      if(err) {
        $scope.error = err;
        return $scope.error ;
      }
      if(result.authenticated) {
        $rootScope.authenticated = result.authenticated;
        $rootScope.user = result.user;
        $rootScope.site = result.site;
        SessionService.isAuthenticated(function (err, isAuthenticated) {
          $rootScope.authenticated = isAuthenticated;
          SessionService.superadmin(function (err, isSuperadmin) {
            $rootScope.superadmin = isSuperadmin;
            $state.go('layout.home');
          });
        });        
      }
      $log.debug("[SigninController.signin]", result);
    });
  };
  
});
jumplink.cms.controller('FooterController', function($scope) {

});
jumplink.cms.controller('HomeController', function($scope, $log, authenticated) {

  $log.debug('authenticated', authenticated);
  
});
jumplink.cms.controller('LayoutController', function($rootScope, sites, hosts) {

  $rootScope.sites = sites;
  $rootScope.selectedSite = sites[0];

  $rootScope.hosts = hosts;
  $rootScope.selectedHost = hosts[0];
});
jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, RoutesService, UtilityService, HistoryService) {
  if(angular.isUndefined($scope.routes)) {
    $scope.routes = [];
  }
  $scope.showMainRoutes = false;

  $scope.goToHashPosition = HistoryService.goToHashPosition;

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    // $log.debug("[RoutesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      RoutesService.findByHost({host:newValue}, function(err, routes) {
        if(err) {
          $scope.routes = [];
        }
        else {
          $scope.routes = routes;
        }
        // $log.debug("[RoutesController] new routes",routes);
      });
    }
  });

  var appendToStatename = function (statename, toAppend) {
    $log.debug("[RoutesController.appendToStatename]", statename, toAppend);
    if(angular.isString(toAppend) && toAppend.length > 0) {
      if(angular.isString(statename) && statename.length > 0) {
        statename += "."+toAppend.toLowerCase();
      } else {
        statename = toAppend.toLowerCase();
      }
    }
    return statename;
  };

  var generateObjectnameAndStatename = function (route) {
    route.state.name = "";
    route.state.name = appendToStatename(route.state.name, route.state.parent);
    route.state.name = appendToStatename(route.state.name, route.key);
    route.objectName = RoutesService.generateObjectnameFromStatename(route.state.name);
    if(!angular.isString(route.objectName) || route.objectName.length <= 0) {
      route.objectName = RoutesService.generateObjectnameFromUrl(route.url);
    }
    return route;
  };

  $scope.$watch('routes', function (newValue, oldValue) {
    $log.log("[RoutesController.watch.routes]", newValue);
    for(var i = 0; i < $scope.routes.length; i++) {
      $scope.routes[i] = generateObjectnameAndStatename($scope.routes[i]);
    }
  }, true);

  $scope.save = function() {
    RoutesService.saveEachByHost($rootScope.selectedHost, $scope.routes, function(err, results) {
      if(err) {
        $log.error("[RouteController.save] Error!", err);
        return err;
      }
      $scope.routes = results;
    });
  };

  $scope.destroy = function(index, route) {
    $log.debug('[RouteController.destroy] route', route);
    RoutesService.destroy($scope.routes, index, route, function(result) {
      $log.debug('[RouteController.destroy] result', result);
    });
  };

  $scope.add = function() {
    var data = {main: true};
    RoutesService.append($scope.routes, data, function(err, routes) {
      $scope.routes = routes;
      if(err) {
        $log.error("Error: On add routes!", err);
        return err;
      }
      $log.debug("[RoutesController.add] Add routes done!", routes);
    });
  };

  $scope.addAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.addAlternativeUrl]", $index, route);
    if(angular.isUndefined(route.alternativeUrls) || !angular.isArray(route.alternativeUrls)) {
      route.alternativeUrls = [""];
    }
    route.alternativeUrls.push("");
  };

  $scope.removeAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.removeAlternativeUrl]", $index, route);
    if(route.alternativeUrls.length >= 1) {
      route.alternativeUrls.pop();
    }
  };

  $scope.edit = function($index, route) {
    $log.debug("[RoutesController.edit] TODO!", $index, route);
  };

  $scope.moveForward = function(index, route) {
    RoutesService.moveForward(index, $scope.routes, function(err, routes) {
      if(err) {
        $log.error("Error: On move route forward!", err);
        return err;
      }
      $scope.routes = routes;
    });
  };

  $scope.moveBackward = function(index, route) {
    RoutesService.moveBackward(index, $scope.routes, function(err, routes) {
      if(err) {
        $log.error("Error: On move route backward!", err);
        return err;
      }
      $scope.routes = routes;
    });
  };

});

jumplink.cms.controller('StatusController', function($rootScope, $scope, status, $location, $anchorScroll, $state, $log, $interval, CmsService, moment) {
  var page = $state.current.name;
  $scope.status = status;

  $log.debug("[StatusController]", $scope.status);

  $scope.goTo = function (hash) {
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  };

  $scope.restart = function () {
    $log.debug("[StatusController.restart]");
    CmsService.restart(function (err, res) {
      $log.debug(err, res);
    });
  };

  var calcUptime = function () {
    $scope.uptime = moment($scope.status.pm2[0].pm2_env.pm_uptime).fromNow(true);
  };
  calcUptime();
  $interval(calcUptime, 1000);

});
jumplink.cms.controller('ThemesController', function($rootScope, $scope, $log, ThemeService) {
  $scope.themeSettings = {};

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[ThemesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      ThemeService.findByHost(newValue, function(err, themes) {
        $scope.themeSettings = themes;
      });
    }
  });
  
  $scope.save = function() {
    $log.debug('themeSettings', $scope.themeSettings);
    ThemeService.updateOrCreateEachByHost($rootScope.selectedHost, $scope.themeSettings.available, function(data) {
      // $scope.themeSettings = data;
      $log.debug(data);
    });
  };
  
});
jumplink.cms.controller('ToolbarController', function($scope, $log, routes) {

  $scope.routes = routes;
  $scope.title = "JumpLink CMS Administration";
  $scope.shorttitle = "Admin";
  $scope.position = "fixed-top";
  $scope.fluid = true;
});
jumplink.cms.controller('UserController', function($scope, $rootScope, user, $state, $log, UserService) {
  $scope.user = user;

  $scope.save = function (user) {
    if(angular.isUndefined(user)) {
      user = $scope.user;
    }
    UserService.updateOrCreateByHost($rootScope.selectedHost, user, function (err, user) {
      $state.go('layout.users');
    });
  };

  UserService.subscribe();
});
jumplink.cms.controller('UsersController', function($scope, $rootScope, $sailsSocket, $log, UserService) {
  $scope.users = {};

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[ThemesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      UserService.findByHost(newValue, function(err, users) {
        $scope.users = users;
      });
    }
  });

  $scope.remove = function(user) {
    UserService.remove($scope.users, user);
  };

  UserService.subscribe();

});