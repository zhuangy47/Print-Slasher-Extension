# Print Slasher


## Features
This extension helps with commenting out print statements. This is particularly useful if you're a bad programmer and refuse to use a standard logging library like me.
Each command will target your current text selection, or if nothing is selected, it targets the whole file.
* `Comment Out Prints`: Comments out print statements
* `Uncomment Prints`: Uncomments out print statements
* `Remove Prints`: Deletes any line with an uncommented print statement  
* `Insert Directives`: Insert directives around print statements. This is intended for use in languages that support directives (i.e. C, C++, etc). Defaults to "#ifdef PRINT_DEBUG" and "#endif".
* `Remove Directives`: Remove directives around print statements. This is intended for use in languages that support directives (i.e. C, C++, etc). Defaults to "#ifdef PRINT_DEBUG" and "#endif".
* `Remove Directives and Statement Between`: Remove directives around print statements and the print statements themselves. This is intended for use in languages that support directives (i.e. C, C++, etc). Defaults to "#ifdef PRINT_DEBUG" and "#endif".



<!-- \!\[feature X\]\(images/feature-x.png\) -->

## Extension Settings

* `printSlasher.keywords`: Additional keywords to target
* `printSlasher.directiveStart`: Directive start string to be inserted before target print statements for directive-based commands. Commands that remove directives will also match for this string. 
* `printSlasher.directiveEnd`: Directive end string to be inserted after target print statements for directive-based commands. Commands that remove directives will also match for this string. 
* `printSlasher.automaticLanguageDetection`: Toggle on whether to automatically include the print statement as a target keyword for the language the current file is in. 

## Known Issues

1. This extension's development was subject to my ability to code. Although not a specific issue, this is generally a recipe for disaster.

2. If you call "Remove Directives" and there just so happens to be a starting or ending directive that matches the one specified in settings, the command will remove it even if the extension didn't originally put it there. In general, this extension does not distinguish between directives and comments it placed versus directives and pre-existing comments and directives on/around print statements.

## Release Notes
### 1.0.0
Initial release.


