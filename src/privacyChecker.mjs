
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

    get_column_stats(dataset, columns){
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

    get_columns_stats(dataset, columns_combinations){

        let column_stats = {};

        for (let combo of columns_combinations){
            column_stats[combo] = this.get_column_stats(dataset, combo);
        }

        return column_stats;
    }

    get_dataset_stats(dataset){

        let fieldKeys = dataset.fields;
        let columns_combinations = this.get_all_combinations_if_a_set(fieldKeys);

        let column_stats =  this.get_columns_stats(dataset, columns_combinations);
        console.log(column_stats)
        return column_stats;
    }

    get_dataset_singletons(dataset){
        let column_stats = this.get_dataset_stats(dataset);
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

    get_columns_and_singletons_stats(dataset){

        let singleton_stats = {};
        let column_stats = {};

        let fieldKeys = dataset.fields;
        let columns_combinations = this.get_all_combinations_if_a_set(fieldKeys);

        let records = dataset.records;
        let dataset_size = records.length;


        let combo_counts = {};
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

                    if (!(combo in singleton_stats)){
                        singleton_stats[combo] = {};
                    }
                    singleton_stats[combo][curr] = record_index;
                } else {
                    counts[curr] += 1;

                    if(curr in singleton_stats[combo]){
                        delete singleton_stats[combo][curr]
                    }
                }
            }
            combo_counts[combo] = counts;
        }
        console.log(combo_counts);
        console.log(singleton_stats)

        for (let combo in singleton_stats){
            let abs_value = Object.keys(singleton_stats[combo]).length;
            let percentage = Math.round(abs_value/dataset_size*100);
            column_stats[combo] = {'absolute_value': abs_value,
                'percentage':percentage
            }
        }
        console.log(column_stats)

        return column_stats, singleton_stats;
    }

}//EndClass.