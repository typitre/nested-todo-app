/* eslint linebreak-style: ["error", "windows"] */
/* eslint func-names: ["error", "never"]*/

/*

TODO: Can press enter and split the text into two todos.
TODO: Drag and drop.
TODO: Replace button and +/- text with images.

BUG: Tabbing into a todo that is compelted.

*/

var util = {
  uuid: function uuid() {
    /* jshint bitwise:false */
    var i; var random;
    var uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  },

  store: function (namespace, data) {
    if (arguments.length === 2) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } 
      var store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || {isTopLevel: true, subTodos: [{
        containerId: util.uuid(),
        todoText: '', 
        secondaryText: '', 
        completed: false, 
        higherLevelCompleted: false, 
        id: util.uuid(), 
        subTodos: [],
        expandSubTodos: true}
      ]};
    
  }
};

var nestedTodo = {

  todoStorage: util.store('nested-todos'),
  mainTodoApp: document.getElementById('main-todo-app'),

  // Function will check to see if the list is empty.
  // This could be from either deleting the only todo, or clearing a fully completed list.
  checkForEmptyList: function() {
    if (this.todoStorage.subTodos.length === 0) {
      this.todoStorage = {subTodos: [{
        isTopLevel: true,
        containerId: util.uuid(),
        todoText: '',
        secondaryText: '',
        completed: false,
        higherLevelCompleted: false,
        id: util.uuid(),
        subTodos: [],
        expandSubTodos: true}
      ]};
      this.render();

      var id = this.todoStorage.subTodos[0].id;
      document.getElementById(id).focus();
    }
  },

  // Creation of a new todo. Id is the id of the todo item that enter was pressed on.
  createTodo: function(id, event) {
    var searchObject = this.findTodoUsingID(id);
    var todoArray = searchObject.parentObject.subTodos;
    var index = searchObject.todoIndex;

    var newTodo = new Object({
      containerId: util.uuid(),
      todoText: '',
      secondaryText: '',
      completed: false,
      higherLevelCompleted: false,
      id: util.uuid(),
      subTodos: [],
      expandSubTodos: true
    });

    if (searchObject.parentObject.completed === true) {
      newTodo.higherLevelCompleted = true;
    }

    todoArray.splice(index + 1, 0, newTodo);
    this.render();
    document.getElementById(newTodo.id).focus();
  },

  // Will delete a todo based on the id. At the end of the function, it returns the todo object.
  // The returned todo object is used by the nest and unNest function, as they delete the todo and reinsert it.
  deleteTodo: function(id) {
    var searchObject = this.findTodoUsingID(id);
    var index = searchObject.todoIndex;
    var todoArray = searchObject.parentObject.subTodos;

    var removedTodo = todoArray.splice(index, 1)[0];
    this.render();
    return removedTodo;
  },

  // Requires the id of the todo that tab was pressed on.
  nestTodo: function(id) {
    var searchObject = this.findTodoUsingID(id);
    var todoArray = searchObject.parentObject.subTodos;
    var nestToIndex = searchObject.todoIndex - 1;

    // Checks to see if you are trying to nest a todo that cannot be indented.
    // Todos that cannot be indented are:
    // 1. The very first todo in the list.
    // 2. Subtodos that are at the top of their subtodo list.
    if (nestToIndex === -1) {
      return;
    }

    var todo = nestedTodo.deleteTodo(id);

    if (todoArray[nestToIndex].completed === true) {
      todo.higherLevelCompleted = true;
    }

    todoArray[nestToIndex].subTodos.push(todo);
    todoArray[nestToIndex].expandSubTodos = true;
    this.render();
    document.getElementById(id).focus();
    this.moveCursorToEnd(id);
  },

  // Requires the id of the todo that shift + tab was pressed on.
  unNestTodo: function(id) {
    var searchObject = this.findTodoUsingID(id);

    // Checks to see if you are trying to outdent a todo that is already at the top level of the list.
    if (searchObject.parentObject === this.todoStorage) {
      return;
    }

    var todo = this.deleteTodo(id);


    var parentSearchObject = this.findTodoUsingID(searchObject.parentObject.id);
    var parentIndex = parentSearchObject.todoIndex;
    var parentArray = parentSearchObject.parentObject.subTodos;

    if (parentSearchObject.parentObject.completed === true) {
      todo.higherLevelCompleted = true;
    } else {
      todo.higherLevelCompleted = false;
    }

    parentArray.splice(parentIndex + 1, 0, todo);
    this.render();
    document.getElementById(id).focus();
    this.moveCursorToEnd(id);
  },

  // Clear out HTML of main-todo-app <section>.
  preRender: function() {
    document.getElementById('main-todo-app').innerHTML = '';
  },

  // Method runs on an empty <section> of HTML and fills it in based on the todoStorage Object.
  // Render all todos by passing in todoStorage.subTodos and 'main-todo-app' section.
  // The arguments on this method need to be non-static so the recursion works.
  htmlBuilder: function(arrayToRender, element) {
    // Create a new UL for the top level todos of the current arrayToRender.
    var newUl = document.createElement('ul');
    newUl.id = util.uuid();

    // For loop runs for each element in the arrayToRender.
    for (var i = 0; i < arrayToRender.length; i++) {
      // Creation of HTML elements that make up each todo.
      var todoLi = document.createElement('li');
      var buttonSpan = document.createElement('span');
      var expanderButton = document.createElement('span');
      var todoSpan = document.createElement('span');
      var todoDiv = document.createElement('div');
      var secondaryTextDiv = document.createElement('div');

      // Create a variable for the current todos subTodos array. Used for recursion.
      var subTodos = arrayToRender[i].subTodos;
      if (subTodos.length > 0) {
        var processSubTodos = true;
      } else {
        processSubTodos = false;
      }

      // todoSpan is the span element that houses the text of the todo. It will process any HTML such as <b> and <i>.
      // contentEditable means that the span can be clicked into and edited.
      todoSpan.contentEditable = 'true';
      todoSpan.id = arrayToRender[i].id;
      todoSpan.innerHTML = arrayToRender[i].todoText;
      todoSpan.classList.add('todos');
      todoSpan.setAttribute('spellcheck', 'false');

      // Check for subtodos and add appropriate graphics and classes.
      if (subTodos.length > 0) {
        buttonSpan.innerHTML = '⦿';
        buttonSpan.classList.add('has-subtodos');
      } else {
        buttonSpan.innerHTML = '•';
        buttonSpan.classList.add('no-subtodos');
      }
      buttonSpan.classList.add('button');

      // Check to see if subtodo list should be expanded and add appropriate graphics and classes.
      if (arrayToRender[i].expandSubTodos === true) {
        expanderButton.innerHTML = '-';
      } else {
        expanderButton.innerHTML = '+';
        processSubTodos = false;
      }

      if (subTodos.length === 0) {
        expanderButton.classList.add('hide');
      } else {
        expanderButton.classList.add('show');
      }

      expanderButton.classList.add('expander');

      // Build the secondary text HTML.
      secondaryTextDiv.innerHTML = arrayToRender[i].secondaryText;
      secondaryTextDiv.contentEditable = 'true';
      secondaryTextDiv.classList.add('secondaryText');
      secondaryTextDiv.setAttribute('spellcheck', 'false');

      todoDiv.classList.add('inline-flex');

      if (arrayToRender[i].secondaryText === '') {
        secondaryTextDiv.classList.add('hidden');
      }

      // Check for completion and add corresponding classes.
      if (arrayToRender[i].completed === true) {
        todoLi.classList.add('completed');
        buttonSpan.classList.add('completed');
        secondaryTextDiv.classList.add('completed');
      } else {
        todoLi.classList.add('not-completed');
        buttonSpan.classList.add('not-completed');
      }

      if (arrayToRender[i].higherLevelCompleted === true) {
        todoLi.classList.add('grey');
        buttonSpan.classList.add('grey');
        secondaryTextDiv.classList.add('grey');
      }

      // Build the HTML list element by appending all the sub elements.
      todoDiv.appendChild(expanderButton);
      todoDiv.appendChild(buttonSpan);
      todoDiv.appendChild(todoSpan);

      todoLi.appendChild(todoDiv);
      todoLi.appendChild(secondaryTextDiv);

      // Add the <li> to the <ul> element after it has been built.
      newUl.appendChild(todoLi);

      // Check for subTodos in the current todo. If they exist, recurse into the method to repeat the steps for subTodos.
      if (processSubTodos) {
        this.render(subTodos, newUl);
      }
    }

    element.appendChild(newUl);
  },

  // Method to run the preRender and htmlBuilder. If no arguments are passed in, set them to render the entire page.
  render: function(arrayToRender, renderElement) {
    if (arguments.length === 0) {
      arrayToRender = this.todoStorage.subTodos;
      renderElement = this.mainTodoApp;
    }
    nestedTodo.preRender();
    nestedTodo.htmlBuilder(arrayToRender, renderElement);
    util.store('nested-todos', this.todoStorage);
  },

  // Set up of event listeners.
  eventListeners: function() {
    // Focusout listener to be removed.

    // this.mainTodoApp.addEventListener('focusout', function(event) {
    //   debugger;
    //   this.render();
    // }.bind(this));

    this.mainTodoApp.addEventListener('keydown', function(event) {
      this.keydownPressed(event);
    }.bind(this));

    this.mainTodoApp.addEventListener('keyup', function(event) {
      this.updateText(event);
    }.bind(this));

    this.mainTodoApp.addEventListener('click', function(event) {
      if (event.target.classList.value.includes('expander')) {
        this.toggleSubTodoExpansion(event);
      }
    }.bind(this));

    document.getElementById('clear-completed').addEventListener('click', function() {
      this.clearCompleted('all');
      this.checkForEmptyList();
    }.bind(this));
  },

  // Method for directing a keydown event.
  keydownPressed: function(event) {
    if (event.key === 'Tab' && event.shiftKey === false) {
      event.preventDefault();
      this.nestTodo(event.target.id);
    }
    if (event.key === 'Tab' && event.shiftKey === true) {
      event.preventDefault();
      this.unNestTodo(event.target.id);
    }
    if (event.key === 'Enter' && event.shiftKey === false && event.ctrlKey === false) {
      if (event.target.classList.value.includes('todos')) {
        event.preventDefault();
        this.createTodo(event.target.id, event);
      }
      if (event.target.classList.value.includes('secondaryText')) {
        event.preventDefault();
        var id = event.target.parentElement.querySelector('.todos').id;
        this.render();
        document.getElementById(id).focus();
        this.moveCursorToEnd(id);
      }
    }
    if (event.key === 'Enter' && event.ctrlKey === true) {
      if (event.target.classList.value.includes('todos')) {
        event.preventDefault();
        this.toggleCompleted(event.target.id);
      }
    }
    if (event.key === 'Enter' && event.shiftKey === true) {
      if (event.target.classList.value.includes('todos')) {
        event.preventDefault();
        this.switchToSecondaryText(event.target.id);
      }
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      var focusId = this.returnPrevOrNextTodoId(event.target.id, 'prev');
      if (focusId === undefined) {return;}
      this.render();
      document.getElementById(focusId).focus();
      this.moveCursorToEnd(focusId);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      var focusId = this.returnPrevOrNextTodoId(event.target.id, 'next');
      if (focusId === undefined) {return;}
      this.render();
      document.getElementById(focusId).focus();
      this.moveCursorToEnd(focusId);
    }
  },

  // Initialize the app.
  init: function() {
    this.eventListeners();
    this.render();
  },

  //
  toggleSubTodoExpansion: function(event) {
    var searchObject = this.findTodoUsingID(event.target.parentElement.querySelector('.todos').id);
    searchObject.todo.expandSubTodos = !searchObject.todo.expandSubTodos;
    this.render();
  },

  // Used to direct functions based on text entered.
  updateText: function(event) {
    var newText = event.target.innerHTML;

    // Check if the text being entered is in the secondaryText element.
    // Get appropriate todo id.
    if (event.target.classList.value === 'secondaryText') {
      id = event.target.parentElement.querySelector('.todos').id;
    } else {
      var id = event.target.id;
    }

    var searchObject = this.findTodoUsingID(id);
    var todo = searchObject.todo;

    if (event.target.classList.value === 'todos') {
      // Used to remove an empty todo.
      if (todo.todoText === '' && (event.key === 'Backspace' || event.key === 'Delete')) {
        var focusId = this.returnPrevOrNextTodoId(id, 'prev');

        this.deleteTodo(id);
        this.checkForEmptyList();
        if (focusId === undefined) {
          return;
        }
        document.getElementById(focusId).focus();
        this.moveCursorToEnd(focusId);
      }

      // Update todo object based on text entered in the browser.
      todo.todoText = newText;
    }
    
    if (event.target.classList.value === 'secondaryText') {
      if (todo.secondaryText === '' && (event.key === 'Backspace' || event.key === 'Delete')) {
        this.render();

        var focusElement = event.target.parentElement.querySelector('.todos');
        document.getElementById(focusElement.id).focus();
        this.moveCursorToEnd(focusElement.id);
      }

      // Update secondary text based on text entered in the browser.
      todo.secondaryText = newText;
    }

    util.store('nested-todos', this.todoStorage);
  },

  moveCursorToEnd: function(id) {
    var selection = window.getSelection();

    // Get the length of the text content in the todo.
    var offset = selection.focusNode.textContent.length;

    // Collapse the carot to the end of the todo based on the length.
    selection.collapse(selection.focusNode, offset);
  },

  toggleHigherLevelCompleted: function(todo, state) {
    for (var i = 0; i < todo.subTodos.length; i++) {
      todo.subTodos[i].higherLevelCompleted = state;

      if (todo.subTodos[i].subTodos.length > 0) {
        this.toggleHigherLevelCompleted(todo.subTodos[i], state);
      }
    }
  },

  toggleCompleted: function(id) {
    var searchObject = this.findTodoUsingID(id);
    searchObject.todo.completed = !searchObject.todo.completed;

    // Recursion to set higherLevelCompleted for subTodos.
    this.toggleHigherLevelCompleted(searchObject.todo, searchObject.todo.completed);
    this.render();
    var focusId = this.returnPrevOrNextTodoId(id, 'next');
    if (focusId === undefined) {
      focusId = id;
    }
    document.getElementById(focusId).focus();
    this.moveCursorToEnd(focusId);
  },

  switchToSecondaryText: function(id) {
    this.render();
    document.getElementById(id).parentElement.parentElement.querySelector('.secondaryText').classList.remove('hidden');
    document.getElementById(id).parentElement.parentElement.querySelector('.secondaryText').focus();
    this.moveCursorToEnd();
  },

  // Used for moving through the todos with the arrow keys, or when a todo is deleted.
  returnPrevOrNextTodoId: function(id, direction) {
    var idArray = [];

    // Recursive method to push all the todo IDs to an array in the correct order.
    function searchThroughTodos(id, todosArray) {
      if (arguments.length < 2) {
        todosArray = nestedTodo.todoStorage.subTodos;
      }

      for (var i = 0; i < todosArray.length; i++) {
        idArray.push(todosArray[i].id);

        if (todosArray[i].subTodos.length > 0 && todosArray[i].expandSubTodos === true) {
          searchThroughTodos(id, todosArray[i].subTodos);
        }
      }
    }

    // Find the original todo and then return either the next todo in the list, or previous.
    searchThroughTodos(id);

    var originalIndex = idArray.indexOf(id);

    if (direction === 'next') {
      return idArray[originalIndex + 1];
    }

    if (direction === 'prev') {
      return idArray[originalIndex - 1];
    }
  },

  // Move through the entire object and check for the completed property. Delete any todos found.
  clearCompleted: function(subTodosArray) {
    var deleteArray = [];

    // Recursive method to grab all ids that are completed and push them to an array for deletion.
    function buildDeleteArray(subTodosArray) {
      if (subTodosArray === 'all') {
        subTodosArray = nestedTodo.todoStorage.subTodos;
      }


      for (var i = 0; i < subTodosArray.length; i++) {
        if (subTodosArray[i].subTodos.length > 0) {
          buildDeleteArray(subTodosArray[i].subTodos);
        }

        if (subTodosArray[i].completed === true) {
          deleteArray.push(subTodosArray[i].id);
        }
      }
    }

    buildDeleteArray(subTodosArray);

    for (var i = 0; i < deleteArray.length; i++) {
      this.deleteTodo(deleteArray[i]);
    }
  },

  // Pass in an id and findTodoUsingID will return an object with three properties:
  // 1. todoIndex -- the index position of the todo.
  // 2. parentObject -- a reference to the parent object, which can be used in other methods.
  // 3. todo -- a reference to the todo object.

  findTodoUsingID: function(id) {
    /*
    Define the function recursiveFind but do not run it yet.
    It takes in three arguments:

    1. id -- the id of the todo you are searching for.
    2. storageArray -- the array of todo objects you are starting at. storageArray is not static since it is used in recursion.
    3. parentObject (OPTIONAL) -- Used in recursion.

    If parentObject is not passed in, the method assumes you are at the top level and returns the todoStorage object.

    */

    function recursiveFind(id, storageArray, parentObject) {
      for (var i = 0; i < storageArray.length; i++) {
        if (storageArray[i].id === id) {
          var searchResults =  {
            todoIndex: i
          };

          if (parentObject) {
            searchResults.parentObject = parentObject;
          } else {
            searchResults.parentObject = nestedTodo.todoStorage;
          }

          searchResults.todo = storageArray[i];

          return searchResults;
        }
        if (storageArray[i].subTodos.length > 0) {
          var searchedSubtodos = recursiveFind(id, storageArray[i].subTodos, storageArray[i]);
          if (searchedSubtodos) {
            return searchedSubtodos;
          }
        }
      }
    }

    // Return recursiveFind, passing in the id and starting at the top level array of todos.
    return recursiveFind(id, nestedTodo.todoStorage.subTodos);
  }
};

var buttonEventListeners = (function() {
  var headerSection = document.getElementById('header-section');

  headerSection.addEventListener('click', function(event) {
    if (event.target.id === 'toggle-shortcuts') {
      var shortcuts = document.getElementById('shortcuts');

      if (shortcuts.classList.contains('hidden')) {
        shortcuts.classList.remove('hidden');
      } else {
        shortcuts.classList.add('hidden');
      }
    }

    if (event.target.id === 'clear-all') {
      nestedTodo.todoStorage = {isTopLevel: true, subTodos: [{
        containerId: util.uuid(),
        todoText: '',
        secondaryText: '',
        completed: false,
        higherLevelCompleted: false,
        id: util.uuid(),
        subTodos: [],
        expandSubTodos: true}
      ]};

      nestedTodo.render();
    }
  });
})();

nestedTodo.init();

