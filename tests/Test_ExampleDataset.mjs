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
        let privacychecker = new PrivacyChecker();
        let results = privacychecker.optimized_columns_and_singletons_stats_and_quasi_identifies(jsonDataset.records);

        assert.equal(results.identifiers.length, 1, "Expected number of identifiers");
        assert.equal(results.quasi_identifiers.length, 1, "Expected size of quasi-identifier");
        assert.equal(results.size_sample, 12, "Expected number of samples");
        assert.equal(results.distinct_values, 10, "Expected number of distinct values");
        assert.equal(results.absolute_value_quasi_identifier, 9, "Expected number of singletons");
        assert.equal(results.percentage_quasi_identifiers, 75, "Expected percentage of singletons");

        results = privacychecker.optimized_columns_and_singletons_stats_and_quasi_identifies(jsonDataset.records, true);

        assert.equal(results.identifiers.length, 1, "Expected number of identifiers");
        assert.equal(results.quasi_identifiers.length, 1, "Expected size of quasi-identifier");
        assert.equal(results.size_sample, 9, "Expected number of samples");
        assert.equal(results.distinct_values, 7, "Expected number of distinct values");
        assert.equal(results.absolute_value_quasi_identifier, 6, "Expected number of singletons");
        assert.equal(results.percentage_quasi_identifiers, 67, "Expected percentage of singletons");

    });


};//EndTests.