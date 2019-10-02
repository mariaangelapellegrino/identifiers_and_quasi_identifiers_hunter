// This script can be called by node by specifying the dataset file as parameter

// it retrieves the dataset to evaluate
const args = process.argv.slice(2);

//it reads the dataset to evaluate and starts the evaluation process
(async () => {
    try {

        const getCSV = require('get-csv');
        let datum = await getCSV(args[0]);
        start_process(datum)
    } catch(e) {
        console.log(e);
    }
})();

const perf = require('execution-time')();
const math = require('mathjs');

// it starts the process to identify identifiers and quasi-identifiers and it reports the execution time in seconds
function start_process(datum){
    let privacychecker = new PrivacyChecker();
    perf.start();
    privacychecker.optimized_columns_and_singletons_stats_and_quasi_identifies(datum)
    const time_result = perf.stop();
    console.log("It requires "+ math.round(time_result.time/1000, 2) + " seconds");  // in seconds
}

//it runs the process to identify id and quasi-indeitifers 10 times and it returns the mean time and the standard deviation.
function timing(datum){
    let run_number = 10;
    let times = [];
    for(var i=0; i<run_number; i++){
        let privacychecker = new PrivacyChecker();
        perf.start();
        privacychecker.optimized_columns_and_singletons_stats_and_quasi_identifies(datum)
        const time_result = perf.stop();
        times.push(time_result.time/1000);  // in seconds
    }

    let mean_time = math.round(math.sum(times)/10, 2);
    let std_dev = math.round(math.std(times),2);

    console.log("Number of runs: " + run_number)
    console.log("Mean time: " + mean_time);
    console.log("Standard deviation: " + std_dev);
}


class PrivacyChecker {


    constructor() {
    }//EndConstructor.

    /*
    *   It detects identifiers and the best quasi-identifier for the given dataset
    *
    *   records: list of record of the dataset
    *
    *   It returns an object with the following structure:
    *       statistics_for_combination as key and a map as value. The map contains
     *          for each combination of columns as key a map as value that contains
     *              singleton_occurrences_absolute_value as key and the number of detected singletons as value
     *              dataset_size: the number of considered values
     *              percentage_of_singletons: the percentage of singletons in the column
     *              distinct_values: the number of distinct values
     *      singleton_occurrences as key and a map as value containing
     *          for each combination a map containing
     *              the index of the column where the singleton occurs as key and the index of the row as value
     *
     *      identifiers as key and the list of identifiers as value
     *      absolute_value_quasi_identifier as key and the number of singletons detected by inspecting the best quasi-identifier as value
     *      size_sample as key and the size of the columns that correspond to the best quasi-identifier as value
     *      percentage_quasi_identifiers: percentage of singletons in the best quasi-identifier
     *      quasi_identifiers as key and the combination of columns that corresponds to the best quasi-identifier as value
     *      distinct_values as key and the number of distinct values that occur in the best quasi-identifier as value
     *
    */
    optimized_columns_and_singletons_stats_and_quasi_identifies(records){

        let flat = require('array.prototype.flat')

        let all_statistics_for_combination = {};
        let all_singleton_occurrences = {};

        let identifiers = [];
        let num_columns = Object.keys(records[0]).length

        let fieldKeys = Object.keys(records[0]);
        let dataset_size = fieldKeys.length
        let columns_to_check = fieldKeys;

        /*
        *   For each combination of columns
        *       it verifies if the combination is an identifier (all the values are distinct)
        *       otherwise it will consider the columns of this combination during the next phase
        */
        for(let subset_size=1; subset_size<=num_columns; subset_size++){
            let combinations = [];
            let data = [];
            // combinations will contain all the combinations to check at each step
            this.get_subsets_of_fixed_size(columns_to_check, columns_to_check.length, subset_size, 0, data, 0, combinations);

            let temp = this.split_in_identifiers_and_not(records, combinations);
            identifiers = identifiers.concat(temp.identifiers);
            let still_to_check = temp.not_identifiers;

            // for all the columns not classified as identifiers, we count the number of singletons
            temp = this.get_columns_and_singletons_stats(records, still_to_check);
            all_statistics_for_combination = {...all_statistics_for_combination, ...temp.statistics_for_combination};
            all_singleton_occurrences = {...all_singleton_occurrences, ...temp.singleton_occurrences};

            // all the columns not classified as identifiers will be considered in the next round of evaluation
            columns_to_check = Array.from(new Set(flat(still_to_check, 1)));
        }

        //console.log(all_statistics_for_combination)
        //console.log(all_singleton_occurrences)

        // it elects the best quasi-identifier: the smallest number of columns that leads to the biggest number of singletons
        let temp_result = this.get_quasi_identifiers(all_statistics_for_combination);
        identifiers = identifiers.concat(temp_result.identifiers);
        let percentage = temp_result.percentage_quasi_identifiers;
        let absolute_value = temp_result.absolute_value_quasi_identifier;
        let size_sample = temp_result.size_sample;
        let quasi_identifiers = temp_result.quasi_identifiers;
        let distinct_values = temp_result.distinct_values;

        let temp_to_return = {statistics_for_combination :all_statistics_for_combination,
            singleton_occurrences:all_singleton_occurrences,
            identifiers:identifiers,
            absolute_value_quasi_identifier:absolute_value,
            size_sample:size_sample,
            percentage_quasi_identifiers:percentage,
            quasi_identifiers:quasi_identifiers,
            distinct_values:distinct_values
        };

        console.log("Number of identifiers: " + identifiers.length);
        console.log("Number of singletons: " + absolute_value + "/" + size_sample)
        console.log("Percentage of singletons: " + percentage);
        console.log("Best quasi-idnetifier: ", quasi_identifiers);
        console.log("Distinct values: " +distinct_values);

        return temp_to_return;

    }

    /*
    * It returns all the subsets of a fixed size of a given set
    * set: set of values
    * size_set: size of the set given as first parameter
    * fixed_size: size of sub-sets to generate
    * index-data: starting point in the set. Provide 0 to consider all the set values
    * data: temporary list. Provide empty list to start
    * index_set: starting point in the temporary list data. Provide 0 to start
    * combinations: list where all the subsets are stored. It will be used as output parameter
    */
    get_subsets_of_fixed_size(set, size_set, fixed_size, index_data, data, index_set, combinations){

        if(index_data === fixed_size){
            combinations.push(data.slice());
            return
        }

        if(index_set>=size_set)
            return;

        data[index_data] = set[index_set];

        this.get_subsets_of_fixed_size(set, size_set, fixed_size, index_data+1, data, index_set+1, combinations);
        this.get_subsets_of_fixed_size(set, size_set, fixed_size, index_data, data, index_set+1, combinations);

    }

    /*
    *   It splits the parameters columns in ID and others.
    *   A column is considered an ID if it contains all distinct values
    *
    *   records: list of dataset record
    *   columns: list of combination of columns (also a single column is a valid combination)
    *
    *   It returns an object containing
    *       identifiers as key and the list of identifiers as value
    *       not_identifiers as key and the list of not identifiers as value
    */
    split_in_identifiers_and_not(records, columns){
        let identifiers = [];
        let still_to_check = [];

        for (let combination of columns){
            let num_of_rows = records.length;
            let column_values = {};

            for(let record of records){
                let curr = new Array();
                for(let column_name of combination){
                    curr = curr.concat(record[column_name]);
                }
                column_values[curr] = "";
            }

            if(Object.keys(column_values).length===num_of_rows){
                identifiers.push(combination);
            }
            else{
                still_to_check.push(combination);
            }
        }

        return {identifiers:identifiers, not_identifiers:still_to_check}
    }

    /*
     * It returns statistics related to the given columns
     *
     * records: list of dataset record
     * columns: list of combination of columns (also a single column is a valid combination)
     * drop_null_values: boolean;  if true all the rows which contain at least one null value will be discarded
     *
     * It will return an object containing
     *      statistics_for_combination as key and a map as value. The map contains
     *          for each combination of columns as key a map as value that contains
     *              singleton_occurrences_absolute_value as key and the number of detected singletons as value
     *              dataset_size: the number of considered values
     *              percentage_of_singletons: the percentage of singletons in the column
     *              distinct_values: the number of distinct values
     *      singleton_occurrences as key and a map as value containing
     *          for each combination a map containing
     *              the index of the column where the singleton occurs as key and the index of the row as value
     *
     *  statistics_for_combination takes note of the statistics for each combination,
     *  singleton_occurrences takes track of the positions of the singleton for each combination
     */
    get_columns_and_singletons_stats(records, columns, drop_null_values){
        if(drop_null_values)
            records = this.drop_null(records);

        let singleton_occurrences = {};
        let statistics_for_combination = {};

        let dataset_size = records.length;

        let occurrences_for_combination = {};
        for (let combo of columns){
            let counts = {};
            for(let record_index in records){
                let record = records[record_index]
                let curr = [];
                for(let column_name of combo){
                    curr = curr.concat(record[column_name]);
                }

                if (!(curr in counts)) {
                    counts[curr] = 1;

                    if (!(combo in singleton_occurrences)){
                        singleton_occurrences[combo] = {};
                    }
                    singleton_occurrences[combo][curr] = record_index;
                } else {
                    counts[curr] += 1;

                    if(curr in singleton_occurrences[combo]){
                        delete singleton_occurrences[combo][curr]
                    }
                }
            }
            occurrences_for_combination[combo] = counts;
        }


        for (let combo in singleton_occurrences){
            let abs_value = Object.keys(singleton_occurrences[combo]).length;
            let percentage = Math.round(abs_value/dataset_size*100);
            statistics_for_combination[combo] = {singleton_occurrences_absolute_value: abs_value,
                dataset_size:dataset_size,
                percentage_of_singletons:percentage,
                distinct_values:Object.keys(occurrences_for_combination[combo]).length
            }
        }

        let temp_to_return = {statistics_for_combination :statistics_for_combination, singleton_occurrences:singleton_occurrences };
        return temp_to_return;
    }

    /*
    *   It retrieves the best quasi-identifier, i.e., the smallest number of columns that leads to the biggest number of detected singletons
    *
    *   stats is the map attached to 'statistics_for_combination' returned by the function 'get_columns_and_singletons_stats'
    *
    *   It will return an object containing
    *       identifiers as key and the list of identifiers as value
    *       absolute_value_quasi_identifier as key and the number of singletons detected by inspecting the best quasi-identifier as value
    *       size_sample as key and the size of the columns that correspond to the best quasi-identifier as value
    *       percentage_quasi_identifiers: percentage of singletons in the best quasi-identifier
    *       quasi_identifiers as key and the combination of columns that corresponds to the best quasi-identifier as value
    *       distinct_values as key and the number of distinct values that occur in the best quasi-identifier as value
    */
    get_quasi_identifiers(stats){

        let distinct_values = -1;
        let size_sample = -1;
        let max_absolute_value = -1;
        let max_percentage = -1;
        let min_size;
        let quasi_identifiers = [];

        let identifiers = [];

        for(let column_combination in stats){
            let statistic = stats[column_combination];
            let column_combnation_as_array = column_combination.split(",");

            //identifiers management
            if(statistic.percentage_of_singletons==100){
                identifiers.push(column_combnation_as_array);
            }
            //quasi identifiers management
            else if(statistic.percentage_of_singletons>max_percentage){
                quasi_identifiers = [];
                quasi_identifiers.push(column_combination);
                min_size = column_combnation_as_array.length;
                max_absolute_value = statistic.singleton_occurrences_absolute_value;
                size_sample = statistic.dataset_size;
                max_percentage = statistic.percentage_of_singletons;
                distinct_values = statistic.distinct_values;
            }
            else if(statistic.percentage==max_percentage){
                let actual_size = column_combnation_as_array.length;
                if(actual_size<min_size){
                    quasi_identifiers = [];
                    min_size = actual_size;
                }
                else if(actual_size==min_size){
                    quasi_identifiers.push(column_combnation_as_array);
                }
            }
        }

        let temp_to_return = {identifiers:identifiers,
            absolute_value_quasi_identifier:max_absolute_value,
            size_sample:size_sample,
            percentage_quasi_identifiers:max_percentage,
            quasi_identifiers:quasi_identifiers,
            distinct_values:distinct_values
        };
        return temp_to_return;
    }

    /*
    * It removes all the rows which contain at least one null value
    * It returns the list of updated list of records
    */
    drop_null(records){

        let records_to_remove= [];

        for(let record_index in records){
            let record = records[record_index];
            for(let key in record){
                let value = record[key];
                if(value === null || typeof value === 'undefined' || value.toLowerCase() == 'null' || value.length == 0){
                    records_to_remove.push(record_index);
                    break
                }
            }

        }

        for(let record_index of records_to_remove.reverse()){
            records.splice(record_index,1);
        }

        return records;
    }
}//EndClass.

