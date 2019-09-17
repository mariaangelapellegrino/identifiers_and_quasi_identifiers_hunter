import {Utils} from "../src/utils.mjs";
import {PrivacyChecker} from "../src/privacyChecker.mjs";

Utils.HttpGet("datasets/01_associazioni.csv").then(runTests);

function runTests(datum) {
    var reader = new csvjson();
    var jsonDataset = reader.read(datum); //Parse the CSV Content.

    QUnit.test("Read and Parse CSV", function (assert) {
        assert.notEqual(jsonDataset, null, "Dataset correctly read.");
        assert.equal(jsonDataset.fields.length, 14, "The dataset has the expected number of columns.");
        assert.equal(jsonDataset.records.length, 57, "The dataset has the expected number of rows.");
    });

    QUnit.test("TestPrivacyOfDataset01", function (assert) {
        //Privacy Checker.
        let privacychecker = new PrivacyChecker();

        const records = jsonDataset.records;
        const fieldKeys = jsonDataset.fields;

        console.log(records)
        console.log(fieldKeys)

        //let combination_set = privacychecker.get_all_combinations_if_a_set(fieldKeys);

        //assert.equal(combination_set.length, 3, "The expected combinations are found..");


        //let columns_stats = privacychecker.get_dataset_stats(jsonDataset);

        //let singletons = privacychecker.get_dataset_singletons(jsonDataset);

        let column_stats, singleton_stats, identifiers, percentage, quasi_identifiers = privacychecker.get_columns_and_singletons_stats(jsonDataset);

    });//EndFunction.


};//EndTests.