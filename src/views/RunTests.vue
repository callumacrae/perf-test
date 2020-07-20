<template>
  <div>
    <!-- TODO: this doesn't work for script tags -->
    <div v-html="formData.setupHtml"></div>

    <!-- the key here is to work around a reactivity issue -->
    <table :key="status">
      <tbody>
        <tr v-for="(result, i) in testResults" :key="i">
          <th class="text-right pr-2 whitespace-no-wrap">{{ result.name }}:</th>
          <td class="w-full">
            <div
              v-if="result.status === 'done'"
              :class="
                `h-8 my-1 bg-${barWidth(result) < 80 ? 'red' : 'green'}-500`
              "
              :style="{ width: `${barWidth(result)}%` }"
            ></div>
            <span v-else>{{ result.status }}</span>
          </td>
          <td class="whitespace-no-wrap pl-2">
            {{ formatResult(result.result) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'vue';

type Status = 'running' | 'done';
interface DataType {
  status: Status;
  formData: {
    setupHtml: string;
    setupJs: string;
    testJs: string;
    tests: { name: string; code: string }[];
  };
  testResults: ResultObj[];
}

interface ResultObj {
  name: string;
  status: Status;
  result?: ResultData;
}

interface ResultData {
  totalTime: number;
  runs: number;
  average: number;
  perSecond: number;
}

export default {
  data(): DataType {
    return {
      status: 'running',
      // @ts-ignore
      formData: JSON.parse(this.$route.query.testData),
      testResults: []
    };
  },
  mounted() {
    nextTick(() => this.run());
  },
  methods: {
    run(): void {
      const { testJs, tests } = this.formData;

      let promise = Promise.resolve();

      for (const test of tests) {
        promise = promise.then(() => {
          return new Promise(resolve => {
            const resultObj: ResultObj = { name: test.name, status: 'running' };
            this.testResults.push(resultObj);
            setTimeout(() => {
              resultObj.result = this.runTest(testJs, test.code);
              resultObj.status = 'done';
              resolve();
            });
          });
        });
      }

      promise.then(() => {
        this.status = 'done';
      });
    },
    runTest(setupCode: string, testCode: string): ResultData {
      const runTest = new Function(`
        ${setupCode}

        const startTime = performance.now();

        ${testCode};

        return performance.now() - startTime;
      `);

      let runs = 0;
      let totalTime = 0;
      const MAX_RUNS = 1e3; // @TODO INCREASE
      const MAX_TIME = 5e3;

      for (; runs < MAX_RUNS && totalTime < MAX_TIME; runs++) {
        totalTime += runTest();
      }

      const average = totalTime / runs;
      return { totalTime, runs, average, perSecond: Math.round(1e3 / average) };
    },
    formatResult(result: ResultData): string {
      if (!result || !result.perSecond) {
        return '';
      }
      return result.perSecond + ' runs/s';
    },
    barWidth(result: ResultObj): number {
      if (!result.result) {
        return 0;
      }
      return (100 / this.maxPerSecond) * result.result.perSecond;
    }
  },
  computed: {
    maxPerSecond(): number {
      return Math.max(
        ...this.testResults.map(({ result }) => (result ? result.perSecond : 0))
      );
    }
  },
  watch: {
    testResults: {
      deep: true,
      handler() {
        setTimeout(() => {
          const height = this.$el.getBoundingClientRect().height;
          window.parent.postMessage(`new-height ${height}`, '*');
        });
      }
    }
  }
};
</script>
