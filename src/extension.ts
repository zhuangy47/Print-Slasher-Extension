import * as vscode from 'vscode';
type StringToStringMap = {
    [key: string]: string;
};

type StringToStringtextay = {
    [key: string]: string[];
};

const defaultLanguageKeywords: StringToStringtextay = {
    "javascript": ["console.log"],
    "typescript": ["console.log"],
    "python": ["print"],
    "c": ["printf"],
    "cpp": ["printf", "std::cout"],
    "cuda-cpp": ["printf", "std::cout"],
    "lua": ["print"],
    "java": ["System.out.println", "System.out.print"],
    "ruby": ["puts", "print"],
    "rust": ["print!", "println!"]
};

const languageCommentSyntax: StringToStringMap = {
    "javascript": "//",
    "typescript": "//",
    "python": "#",
    "c": "//",
    "cpp": "//",
    "cuda-cpp": "//",
    "lua": "--",
    "java": "//",
    "ruby": "#",
    "rust": "//"
};

function getEffectiveKeywords(languageId: string, automaticLanguageDetection: boolean, userKeywords: string[]): string[] {
    const defaultKeywords = defaultLanguageKeywords[languageId] || [];
    return automaticLanguageDetection ? [...new Set([...defaultKeywords, ...userKeywords])] : userKeywords;
}

function getCommentSyntax(languageId: string, automaticLanguageDetection: boolean): string {
    return automaticLanguageDetection ? (languageCommentSyntax[languageId] || "//") : "//";
}

function removeStuff(text: string, keywords: string[], directiveStart: string, directiveEnd: string, remove_curr: boolean, remove_directives: boolean): string[] {
    const lines = text.split('\n');
    const keywordRegex = new RegExp(`^\\s*(${keywords.join('|')})`);
    let indicesToRemove: Set<number> = new Set();
    let startRegex = new RegExp(`^\\s*(${directiveStart})`);
    let endRegex = new RegExp(`^\\s*(${directiveEnd})`);


    lines.forEach((element, index) => {
      if (keywordRegex.test(element)) {
        if (index > 0) {
            if (remove_directives && startRegex.test(lines[index - 1])) {
                indicesToRemove.add(index - 1);
            }
        }
        if (remove_curr) { indicesToRemove.add(index); }
        if (remove_directives && index < text.length - 1) {
            if (endRegex.test(lines[index + 1])) {
                indicesToRemove.add(index + 1);
            }
        }
      }
    });
  
    return lines.filter((_, index) => !indicesToRemove.has(index));
}

function insertDirectives(text: string, keywords: string[], directiveStart: string, directiveEnd: string): string {
    const lines = text.split('\n');
    const keywordRegex = new RegExp(`^\\s*(${keywords.join('|')})`);

    return lines.map(line => {
        if (line.match(keywordRegex)) {
            return `${directiveStart}\n${line}\n${directiveEnd}`;
        }
        return line;
    }).join('\n');
}

function commentOutPrints(text: string, keywords: string[], commentSyntax: string): string {
    const lines = text.split('\n');
    const keywordRegex = new RegExp(`^\\s*(${keywords.join('|')})`);

    return lines.map(line => {
        if (line.match(keywordRegex)) {
            return `${commentSyntax} ${line}`;
        }
        return line;
    }).join('\n');
}

function commentInPrints(text: string, keywords: string[], commentSyntax: string): string {
    const lines = text.split('\n');
    const keywordRegex = new RegExp(`^\\s*${commentSyntax}\\s*${keywords.join('|')}`);

    return lines.map(line => {
        if (line.match(keywordRegex)) {
            console.log(`Line ${line} matched!`);
            return line.replace(`${commentSyntax} `, "");
        }
        console.log(`Line ${line} not matched.`);

        return line;
    }).join('\n');
}

export function activate(context: vscode.ExtensionContext) {
    let commentOut = vscode.commands.registerCommand('print-slasher.commentOut', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            console.log("userKeywords:", userKeywords);
            
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }
            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            const commentSyntax = getCommentSyntax(languageId, automaticLanguageDetection);
            
            const modifiedText = commentOutPrints(text, keywords, commentSyntax);

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(commentOut);

    let commentIn = vscode.commands.registerCommand('print-slasher.commentIn', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }

            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            const commentSyntax = getCommentSyntax(languageId, automaticLanguageDetection);
            
            const modifiedText = commentInPrints(text, keywords, commentSyntax);

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(commentIn);


    let insertDirective = vscode.commands.registerCommand('print-slasher.insertDirectives', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            const directiveStart: string = config.get('directiveStart') || "";
            const directiveEnd: string = config.get('directiveEnd')  || "";
            
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }

            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            
            const modifiedText = insertDirectives(text, keywords, directiveStart, directiveEnd);

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(insertDirective);

    let removeDirective = vscode.commands.registerCommand('print-slasher.removeDirectives', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            const directiveStart: string = config.get('directiveStart') || "";
            const directiveEnd: string = config.get('directiveEnd')  || "";
            
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }

            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            
            const modifiedText = removeStuff(text, keywords, directiveStart, directiveEnd, false, true).join("\n");

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(removeDirective);


    let removeDirectiveDelete = vscode.commands.registerCommand('print-slasher.removeDirectivesAndContents', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            const directiveStart: string = config.get('directiveStart') || "";
            const directiveEnd: string = config.get('directiveEnd')  || "";
            
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }

            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            
            const modifiedText = removeStuff(text, keywords, directiveStart, directiveEnd, true, true).join("\n");

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(removeDirectiveDelete);

    let removePrints = vscode.commands.registerCommand('print-slasher.removePrints', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const config = vscode.workspace.getConfiguration('printSlasher');
            const automaticLanguageDetection = config.get('automaticLanguageDetection', true);
            const keywordsString: string | null = config.get('keywords')  || null;
            const userKeywords: string[] =  (keywordsString === null) ? [] : keywordsString.split(',');
            const directiveStart: string = config.get('directiveStart') || "";
            const directiveEnd: string = config.get('directiveEnd')  || "";
            
            let range;
            if (editor.selection.isEmpty) {
                const firstLine = editor.document.lineAt(0);
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                range = new vscode.Range(editor.selection.start, editor.selection.end);
            }

            const text = editor.document.getText(range);
            const languageId = editor.document.languageId;
            const keywords = getEffectiveKeywords(languageId, automaticLanguageDetection, userKeywords);
            
            const modifiedText = removeStuff(text, keywords, directiveStart, directiveEnd, true, true).join("\n");

            editor.edit(editBuilder => {
                editBuilder.replace(range, modifiedText);
            });
        } else {
            vscode.window.showInformationMessage('Print Slasher must be used in editing environment!');
        }
    });
    context.subscriptions.push(removePrints);
}

export function deactivate() {}
