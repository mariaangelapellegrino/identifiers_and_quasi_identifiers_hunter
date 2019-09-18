
export class PrivacyChecker {

    constructor() {}//EndConstructor.

    get_all_combinations_if_a_set(set) {
        let results = []
        for (let i = 0; i < set.length; i++) {
            // Record size as the list will change
            let resultsLength = results.length;
            for (let j = 0; j < resultsLength; j++) {
                let temp = [];
                temp = temp.concat(set[i].name);
                temp = temp.concat(results[j]);
                results.push(temp);
            }
            results.push([set[i].name]);
        }

        console.log(results);

        return results;
    }

    get_column_stats(dataset, columns, drop_null_values){
        if(drop_null_values)
            dataset = this.drop_null(dataset);

        let records = dataset.records;
        let counts = {};
        for(let record of records){
            let curr = [];
            for(let column_name of columns){
                curr = curr.concat(record[column_name]);
            }

            if (curr in counts) {
                counts[curr] += 1;
            } else {
                counts[curr] = 1;
            }
        }
        return counts;
    }

    get_columns_stats(dataset, columns_combinations, drop_null_values){

        if(drop_null_values)
            dataset = this.drop_null(dataset);

        let column_stats = {};

        for (let combo of columns_combinations){
            column_stats[combo] = this.get_column_stats(dataset, combo, false);
        }

        return column_stats;
    }

    get_dataset_stats(dataset, drop_null_values){

        if(drop_null_values)
            dataset = this.drop_null(dataset);

        let fieldKeys = dataset.fields;
        let columns_combinations = this.get_all_combinations_if_a_set(fieldKeys);

        let column_stats =  this.get_columns_stats(dataset, columns_combinations, false);
        console.log(column_stats)
        return column_stats;
    }

    get_dataset_singletons(dataset, drop_null_values){
        if(drop_null_values)
            dataset = this.drop_null(dataset);

        let column_stats = this.get_dataset_stats(dataset, false);
        let singletons = this.get_singletons(column_stats);
        console.log(singletons)
        return singletons
    }

    get_singletons(column_stats){
        let singletons = {};
        for(let column in column_stats){
            singletons[column] = this.get_column_singletons(column_stats[column]);
        }
        return singletons;
    }

    get_column_singletons(obj){
        let singletons = Object.keys(obj).filter(key => obj[key] === 1);
        return singletons;
    }

    get_columns_and_singletons_stats(dataset, drop_null_values){
        if(drop_null_values)
            dataset = this.drop_null(dataset);

        let singleton_occurrences = {};
        let statistics_for_combination = {};

        let fieldKeys = dataset.fields;
        let columns_combinations = this.get_all_combinations_if_a_set(fieldKeys);

        let records = dataset.records;
        let dataset_size = records.length;


        let occurrences_for_combination = {};
        for (let combo of columns_combinations){
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
        console.log(occurrences_for_combination);
        console.log(singleton_occurrences)

        for (let combo in singleton_occurrences){
            let abs_value = Object.keys(singleton_occurrences[combo]).length;
            let percentage = Math.round(abs_value/dataset_size*100);
            statistics_for_combination[combo] = {singleton_occurrences_absolute_value: abs_value,
                percentage_of_singletons:percentage,
                distinct_values:Object.keys(occurrences_for_combination[combo]).length
            }
        }
        console.log(statistics_for_combination)

        let temp_to_return = {statistics_for_combination :statistics_for_combination, singleton_occurrences:singleton_occurrences };
        return temp_to_return;
    }

    get_columns_and_singletons_stats_and_quasi_identifies(dataset, drop_null_values){
        if(drop_null_values)
            dataset = this.drop_null(dataset);

        console.log(dataset.records)

        let temp = this.get_columns_and_singletons_stats(dataset, false);
        let statistics_for_combination = temp.statistics_for_combination;
        let singleton_occurrences = temp.singleton_occurrences;

        let temp_result = this.get_quasi_identifiers(statistics_for_combination);
        let identifiers = temp_result.identifiers;
        let percentage = temp_result.percentage_quasi_identifiers;
        let quasi_identifiers = temp_result.quasi_identifiers;

        let temp_to_return = {statistics_for_combination :statistics_for_combination,
            singleton_occurrences:singleton_occurrences,
            identifiers:identifiers,
            percentage_quasi_identifiers:percentage,
            quasi_identifiers:quasi_identifiers
        };
        return temp_to_return;
    }

    get_quasi_identifiers(stats){
        let max_percentage = -1;
        let min_size;
        let quasi_identifiers = [];

        let identifiers = [];

        for(let column_combination in stats){
            let statistic = stats[column_combination];

            //identifiers management
            if(statistic.percentage_of_singletons==100){
                identifiers.push(column_combination);
            }
            //quasi identifiers management
            else if(statistic.percentage_of_singletons>max_percentage){
                quasi_identifiers = [];
                quasi_identifiers.push(column_combination);
                min_size = column_combination.split(",").length;
                max_percentage = statistic.percentage_of_singletons;
            }
            else if(statistic.percentage==max_percentage){
                let actual_size = column_combination.split(",").length;
                if(actual_size<min_size){
                    quasi_identifiers = [];
                    min_size = actual_size;
                }
                else if(actual_size==min_size){
                    quasi_identifiers.push(column_combination);
                }
            }
        }

        console.log(identifiers);
        console.log(max_percentage);
        console.log(quasi_identifiers);


        let temp_to_return = {identifiers:identifiers,
            percentage_quasi_identifiers:max_percentage,
            quasi_identifiers:quasi_identifiers
        };
        return temp_to_return;
    }

    drop_null(dataset){

        let records_to_remove= [];

        let records = dataset.records;
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

        dataset.records = records;
        return dataset;
    }

}//EndClass.