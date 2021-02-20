function createCodeToFillAnswers() {

    //Only this part is specific to your sheet. {

    const sheet_name = 'Problem Data';
    const cells = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name).getDataRange().getValues();

    const num_problems = cells[0][10];
    const problem_start_index = 7;

    const a_problems = [];
    const a_answers  = [];

    for (let i = problem_start_index; i < problem_start_index + num_problems; ++i) {
        const problem_type = cells[i][2];
        const problem      = cells[i][4];
        const answer       = cells[i][5];
        if (problem_type == 'Short Answer') {
            a_problems.push(problem);
            a_answers.push(answer);
        }
    }

    //} Only this part is specific to your sheet.

    const ret = JSON.stringify([a_problems, a_answers]);

    console.log(`

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

    const tmp = JSON.parse(\`${ret.replace(/\\n/g, '\\\\n')}\`);
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

                console.log(\`🔵 Processing the card [ \${problem} ]...\`);

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
                                console.log(\`└ \${s_problems_to_process.size} problems left.\`);
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

`);

}

