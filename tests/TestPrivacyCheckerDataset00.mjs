import {Utils} from "../src/utils.mjs";
import {PrivacyChecker} from "../src/privacyChecker.mjs";

Utils.HttpGet("datasets/00_toyExample.csv").then(runTests);

function runTests(datum) {
    var reader = new csvjson();
    var jsonDataset = reader.read(datum); //Parse the CSV Content.

    QUnit.test("Read and Parse CSV", function (assert) {
        assert.notEqual(jsonDataset, null, "Dataset correctly read.");
        assert.equal(jsonDataset.fields.length, 3, "The dataset has the expected number of columns.");
        assert.equal(jsonDataset.records.length, 12, "The dataset has the expected number of rows.");
    });

    QUnit.test("TestPrivacyOfDataset01", function (assert) {
        //Privacy Checker.
        let privacychecker = new PrivacyChecker();

        const records = jsonDataset.records;
        const fieldKeys = jsonDataset.fields;

        console.log(records)
        console.log(fieldKeys)

        let combination_set = privacychecker.get_all_combinations_if_a_set(fieldKeys);

        assert.equal(combination_set.length, 7, "The expected combinations are found..");


        //let columns_stats = privacychecker.get_dataset_stats(jsonDataset, true);

        //let singletons = privacychecker.get_dataset_singletons(jsonDataset, true);

        privacychecker.get_columns_and_singletons_stats_and_quasi_identifies(jsonDataset, true);

    });//EndFunction.


};//EndTests.