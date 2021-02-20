# Index

1. [English](#english)

2. [日本語](#japanese)

# Demo

| [![demo_video](https://i.ytimg.com/vi/e1fcszewz98/maxresdefault.jpg)](https://www.youtube.com/watch?v=e1fcszewz98&feature=youtu.be) |
|:-:|
| Demo (YouTube) |

# English 

## Introduction

Using Google Apps Script, you can newly create a Google Form from a Google Sheet.

As an example, say you have this demo sheet: [*Demo sheet for \`fill_google_form_answers_for_short_answer_quiz\`.*](https://docs.google.com/spreadsheets/d/1n4QRk7uA0Q4U_T4oEK3sLEApvdj8qPbHO7ZQRSvhV-A/edit?usp=sharing)

For simplicity, here we limit the types of problems to `Short Answer` or `Radio Button`. This sheet can be converted to a form using the following script `./create_form_from_sheet.js`.

<details>
<summary>Show Code</summary>

```javascript
function createGoogleForm(){

    const sheet_name = 'Problem Data';
    
    const cells = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name).getDataRange().getValues();
  
    const form_title = `${cells[2][1]}_${Math.random()}`;
    console.log(`Creating the form [ ${form_title} ]...`);
    const Form = FormApp.create(form_title);

    Form.setDescription(cells[3][1]);
    Form.setIsQuiz(true)

    const num_problems = cells[0][10];
    const problem_start_index = 7;

    for (let i = problem_start_index; i < problem_start_index + num_problems; ++i) {
        
        const problem_type  = cells[i][2];
        const problem_title = cells[i][4];
        const answer        = cells[i][5];

        if (problem_type == 'Short Answer') {

            Form.addTextItem().setTitle(problem_title);

        } else if (problem_type == 'Radio Button') {

            const radio   = Form.addMultipleChoiceItem().setTitle(problem_title);
            const options = [];

            let j = 7;
            while (true) {
                const option = cells[i][j++];
                if (option == '') {
                    break;
                }
                let is_correct = false;
                if (option == answer) {
                    is_correct = true;
                }
                options.push(radio.createChoice(option, is_correct));
            }

            radio.setChoices(options)
            
        }

    }
    
}
```
</details>

The problem is you cannot programmatically set the correct answer for a problem of the type `Short Answer` whilst such an operation is supported for `Radio Button` (refer to the boolean variable `is_correct` in the script above). This has been recognized as an issue and long discussed (see [*Google Forms Quiz functionality for Google Apps Script FormApp Class TextItem*](https://issuetracker.google.com/issues/117437423)) with no fix by Google.

In this project, we supply a (dirty) workaround for it. Our main script `./create_code_to_fill_answers.js` reads a sheet and dynamically creates a JavaScript code to simulate clicks and key presses to fill the correct answers in the form.

## Usage

1. Create a Google Sheet.

2. Execute `./create_form_from_sheet.js` to convert it to a Google Form.

3. Execute `./create_code_to_fill_answers.js` and copy the output JavaScript code.

<details>
<summary>Example Output</summary>

```javascript
(function() {
    'use strict';

    /*-------------------------------------*/

    /* parameters */

    const is_debug_mode = 1;

    /*-------------------------------------*/

    /* functions */

    function q(parent, css_selector) {
        return parent.querySelector(css_selector);
    }

    function qa(parent, css_selector) {
        return parent.querySelectorAll(css_selector);
    }

    function p(x) {
        if (is_debug_mode) {
            console.log(x);
        }
    }

    function sum(array) {
        return array.reduce((a, b) => { return (a + b); }, 0);
    }

    /*-------------------------------------*/

    /* main */

    //closes all cards
    q(document, 'div.freebirdFormeditorViewPageTitleAndDescription').click();

    const tmp = JSON.parse(`[["Which color will you get when you mix red and blue?","What is the name of the highest mountain in Japan?","What is the name of the country which has the largest population?"],["purple","Mt. Fuji","China"]]`);
    const a_problems = tmp[0];
    const a_answers = tmp[1];

    const cards = qa(document, 'div.freebirdFormeditorViewItemcardRoot');

    const s_problems_to_process = new Set();

    for (let card of cards) {

        const e_problem_title = q(card, 'textarea.appsMaterialWizTextinputTextareaInput.exportTextarea');
        const problem = e_problem_title.getAttribute('data-initial-value');
        const problem_index = a_problems.indexOf(problem);

        //You can speed-up the processing by decreasing each element.
        //Too small a value, however, can cause an incomplete result.
        const a_wait_ms = [
            500,
            500,
            500,
        ];

        if (problem_index != -1) {

            s_problems_to_process.add(problem);

            function fillAnswer() {

                console.log(`🔵 Processing the card [ ${problem} ]...`);

                //expands the card
                e_problem_title.click();

                //clicks the 'Answer key' button
                const e_answer_key = q(card, 'div.appsMaterialWizButtonEl.hasIcon.appsMaterialWizButtonPaperbuttonEl.appsMaterialWizButtonPaperbuttonText.appsMaterialWizButtonPaperbuttonTextColored');
                e_answer_key.click();

                let wait_index = -1;

                window.setTimeout(() => {

                    //inputs the answer
                    let e_answer = q(card, 'input.quantumWizTextinputSimpleinputInput.exportInput');
                    e_answer.click();

                    window.setTimeout(() => {

                        e_answer = q(card, 'input.quantumWizTextinputSimpleinputInput.exportInput'); //Re-select is needed here.
                        document.execCommand('insertText', false, a_answers[problem_index]);

                        //clicks the 'Mark all other answers incorrect' button
                        const e_mark_all_other_answers_incorrect = q(card, 'div.quantumWizTogglePapercheckboxEl.appsMaterialWizTogglePapercheckboxCheckbox.docssharedWizToggleLabeledControl.freebirdThemedCheckbox.freebirdMaterialWidgetsToggleLabeledCheckbox');
                        e_mark_all_other_answers_incorrect.click();

                        window.setTimeout(() => {

                            //clicks the 'Done' button
                            let e_done = qa(card, 'span.appsMaterialWizButtonPaperbuttonLabel.quantumWizButtonPaperbuttonLabel.exportLabel');
                            e_done = e_done[e_done.length - 1];
                            e_done.click();

                            console.log('└ Done.');

                            s_problems_to_process.delete(problem);
                            if (s_problems_to_process.size == 0) {
                                console.log('============');
                                console.log(' Completed. ');
                                console.log('============');
                            } else {
                                console.log(`└ ${s_problems_to_process.size} problems left.`);
                            }

                        }, a_wait_ms[++wait_index]);

                    }, a_wait_ms[++wait_index]);

                }, a_wait_ms[++wait_index]);

            }

            window.setTimeout(fillAnswer, problem_index * (sum(a_wait_ms) * 2));

        }

    }

    /*-------------------------------------*/

})();
```
</details>

4. Open the created form.

5. Press <kbd>F12</kbd> to open the browser's developer tools.

6. Executes the copied script in the console and just wait.

## Supported Browsers

- Chrome

(Firefox is not supported.)

# Japanese

## はじめに

Google Apps Scriptを使えば、Google スプレットシートからGoogle フォームを生成できます。

例えば、このデモ用シートを持っているものとしましょう: [*Demo sheet for \`fill_google_form_answers_for_short_answer_quiz\`.*](https://docs.google.com/spreadsheets/d/1n4QRk7uA0Q4U_T4oEK3sLEApvdj8qPbHO7ZQRSvhV-A/edit?usp=sharing)

簡単のために、ここでは問題の種別を`Short Answer`(記述式)と`Radio Button`(ラジオボタン)に限定しています。このシートは、次のスクリプト(`./create_form_from_sheet.js`)を用いることで、フォームに変換できます。

<details>
<summary>コードを表示</summary>

```javascript
function createGoogleForm(){

    const sheet_name = 'Problem Data';
    
    const cells = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name).getDataRange().getValues();
  
    const form_title = `${cells[2][1]}_${Math.random()}`;
    console.log(`Creating the form [ ${form_title} ]...`);
    const Form = FormApp.create(form_title);

    Form.setDescription(cells[3][1]);
    Form.setIsQuiz(true)

    const num_problems = cells[0][10];
    const problem_start_index = 7;

    for (let i = problem_start_index; i < problem_start_index + num_problems; ++i) {
        
        const problem_type  = cells[i][2];
        const problem_title = cells[i][4];
        const answer        = cells[i][5];

        if (problem_type == 'Short Answer') {

            Form.addTextItem().setTitle(problem_title);

        } else if (problem_type == 'Radio Button') {

            const radio   = Form.addMultipleChoiceItem().setTitle(problem_title);
            const options = [];

            let j = 7;
            while (true) {
                const option = cells[i][j++];
                if (option == '') {
                    break;
                }
                let is_correct = false;
                if (option == answer) {
                    is_correct = true;
                }
                options.push(radio.createChoice(option, is_correct));
            }

            radio.setChoices(options)
            
        }

    }
    
}
```
</details>

ここで問題となるのは、種別が`Short Answer`である問題に対しては、正解の設定を自動化できない点です。(上に示したスクリプト中のブール型変数`is_correct`で操作されるように)ラジオボタンに対してはそのような操作がサポートされているにもかかわらず、です。これは問題として認識され、長く議論されてきましたが([*Google Forms Quiz functionality for Google Apps Script FormApp Class TextItem*](https://issuetracker.google.com/issues/117437423)を参照)、Googleによる修正はまだありません。

このプロジェクトでは、この問題に対する(汚い)回避方法を提供します。私たちのメインスクリプト`./create_code_to_fill_answers.js`は、シートを読み、フォームに正解を入力するためのクリックやキー入力をシミュレートするJavaScriptコードを動的に生成します。

## 用法

1. Google スプレッドシートを作成します。

2. `./create_form_from_sheet.js`を実行して、そのシートをGoogle フォームに変換します。

3. `./create_code_to_fill_answers.js`を実行して、出力されるJavaScriptコードをコピーします。

<details>
<summary>出力の例</summary>

```javascript
(function() {
    'use strict';

    /*-------------------------------------*/

    /* parameters */

    const is_debug_mode = 1;

    /*-------------------------------------*/

    /* functions */

    function q(parent, css_selector) {
        return parent.querySelector(css_selector);
    }

    function qa(parent, css_selector) {
        return parent.querySelectorAll(css_selector);
    }

    function p(x) {
        if (is_debug_mode) {
            console.log(x);
        }
    }

    function sum(array) {
        return array.reduce((a, b) => { return (a + b); }, 0);
    }

    /*-------------------------------------*/

    /* main */

    //closes all cards
    q(document, 'div.freebirdFormeditorViewPageTitleAndDescription').click();

    const tmp = JSON.parse(`[["Which color will you get when you mix red and blue?","What is the name of the highest mountain in Japan?","What is the name of the country which has the largest population?"],["purple","Mt. Fuji","China"]]`);
    const a_problems = tmp[0];
    const a_answers = tmp[1];

    const cards = qa(document, 'div.freebirdFormeditorViewItemcardRoot');

    const s_problems_to_process = new Set();

    for (let card of cards) {

        const e_problem_title = q(card, 'textarea.appsMaterialWizTextinputTextareaInput.exportTextarea');
        const problem = e_problem_title.getAttribute('data-initial-value');
        const problem_index = a_problems.indexOf(problem);

        //You can speed-up the processing by decreasing each element.
        //Too small a value, however, can cause an incomplete result.
        const a_wait_ms = [
            500,
            500,
            500,
        ];

        if (problem_index != -1) {

            s_problems_to_process.add(problem);

            function fillAnswer() {

                console.log(`🔵 Processing the card [ ${problem} ]...`);

                //expands the card
                e_problem_title.click();

                //clicks the 'Answer key' button
                const e_answer_key = q(card, 'div.appsMaterialWizButtonEl.hasIcon.appsMaterialWizButtonPaperbuttonEl.appsMaterialWizButtonPaperbuttonText.appsMaterialWizButtonPaperbuttonTextColored');
                e_answer_key.click();

                let wait_index = -1;

                window.setTimeout(() => {

                    //inputs the answer
                    let e_answer = q(card, 'input.quantumWizTextinputSimpleinputInput.exportInput');
                    e_answer.click();

                    window.setTimeout(() => {

                        e_answer = q(card, 'input.quantumWizTextinputSimpleinputInput.exportInput'); //Re-select is needed here.
                        document.execCommand('insertText', false, a_answers[problem_index]);

                        //clicks the 'Mark all other answers incorrect' button
                        const e_mark_all_other_answers_incorrect = q(card, 'div.quantumWizTogglePapercheckboxEl.appsMaterialWizTogglePapercheckboxCheckbox.docssharedWizToggleLabeledControl.freebirdThemedCheckbox.freebirdMaterialWidgetsToggleLabeledCheckbox');
                        e_mark_all_other_answers_incorrect.click();

                        window.setTimeout(() => {

                            //clicks the 'Done' button
                            let e_done = qa(card, 'span.appsMaterialWizButtonPaperbuttonLabel.quantumWizButtonPaperbuttonLabel.exportLabel');
                            e_done = e_done[e_done.length - 1];
                            e_done.click();

                            console.log('└ Done.');

                            s_problems_to_process.delete(problem);
                            if (s_problems_to_process.size == 0) {
                                console.log('============');
                                console.log(' Completed. ');
                                console.log('============');
                            } else {
                                console.log(`└ ${s_problems_to_process.size} problems left.`);
                            }

                        }, a_wait_ms[++wait_index]);

                    }, a_wait_ms[++wait_index]);

                }, a_wait_ms[++wait_index]);

            }

            window.setTimeout(fillAnswer, problem_index * (sum(a_wait_ms) * 2));

        }

    }

    /*-------------------------------------*/

})();
```
</details>

4. 生成されたフォームを開きます。

5. <kbd>F12</kbd>キーを押して、ブラウザの開発者ツールを開きます。

6. コピーしたスクリプトをコンソールから実行し、待ちます。

## サポートされているブラウザ

- Chrome

(Firefoxはサポートされていません。)

<!-- vim: set spell: -->

