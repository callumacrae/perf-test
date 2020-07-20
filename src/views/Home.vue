<template>
  <div class="max-w-screen-md mx-auto px-4">
    <div class="my-8">
      <h1 class="text-2xl mb-2">Performance checker</h1>
      <p class="text-gray-600">
        A simple client-side tool by
        <a href="http://macr.ae/">Callum Macrae</a>.
      </p>
    </div>

    <fieldset class="rounded-sm border border-gray-300 p-4">
      <legend class="text-center px-4">Preparation code</legend>
      <table class="table-auto w-full">
        <tbody>
          <tr>
            <td class="w-56 pr-2">
              <strong>Setup HTML</strong>
              <p class="text-sm">
                HTML to inject into the page, containing &lt;script&gt; tags and
                stuff.
              </p>
            </td>
            <td>
              <CodeInput
                v-model="formData.setupHtml"
                placeholder="Not yet supported"
                disabled
              />
            </td>
          </tr>
          <tr>
            <td class="w-56 pr-2">
              <strong>One-off JavaScript</strong>
              <p class="text-sm">
                JavaScript that will run once, with the setup HTML above.
                Declare any global variables on the window object, not using
                const or let.
              </p>
            </td>
            <td>
              <CodeInput
                v-model="formData.setupJs"
                placeholder="Not yet supported"
                disabled
              />
            </td>
          </tr>
          <tr>
            <td class="w-56 pr-2">
              <strong>Per-test JavaScript</strong>
              <p class="text-sm">
                JavaScript that will run on every iteration of the test.
              </p>
            </td>
            <td>
              <CodeInput v-model="formData.testJs" />
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>

    <fieldset class="rounded-sm border border-gray-300 p-4 mt-8">
      <legend class="text-center px-4">Test code</legend>
      <div class="space-y-4">
        <div
          v-for="(test, index) in formData.tests"
          class="space-y-2"
          :key="index"
        >
          <div class="space-x-2">
            <strong>Test #{{ index }}</strong>
            <div class="float-right space-x-2">
              <button
                v-if="formData.tests.length > 1"
                type="button"
                class="text-sm"
                @click="deleteTest(index)"
              >
                Delete
              </button>
              <button
                type="button"
                class="text-sm"
                @click="newTestAfter(index)"
              >
                Add new after
              </button>
            </div>
          </div>
          <input
            v-model="test.name"
            type="text"
            class="rounded-sm border border-gray-300 px-3 py-2 w-full"
            placeholder="Test name"
          />
          <CodeInput v-model="test.code" placeholder="Test code" />
        </div>
      </div>
    </fieldset>

    <fieldset class="rounded-sm border border-gray-300 p-4 mt-8 mb-16">
      <legend class="text-center px-4">Results</legend>
      <div class="space-y-4">
        <p class="text-sm">
          Warning: if someone else sent you this link, probably check the code
          above before you run it.
        </p>
        <button
          type="button"
          class="rounded-sm border-2 border-blue-600 text-black no-underline px-4 py-2"
          @click="runTests"
        >
          Run tests
        </button>

        <iframe
          v-if="status === 'running'"
          class="w-full"
          :src="`/run-tests?testData=${encodeURIComponent(runData)}`"
          :style="{ height: `${iframeHeight}px` }"
          :key="iframeKey"
        ></iframe>

        <p v-if="status === 'running'">
          Please note that this tool isn't that accurate (try running the same
          code in multiple tests!), and is best used for finding significant
          differences in simple code. It is no substitute for proper benchmarks.
        </p>
      </div>
    </fieldset>
  </div>
</template>

<script lang="ts">
import CodeInput from '../components/CodeInput';

export default {
  name: 'Home',
  components: {
    CodeInput
  },
  data() {
    let formData = {
      setupHtml: '',
      setupJs: '',
      testJs: '',
      tests: [
        { name: '', code: '' },
        { name: '', code: '' }
      ]
    };

    // @ts-ignore
    if (this.$route.query.testData) {
      try {
        // @ts-ignore
        formData = JSON.parse(this.$route.query.testData);
      } catch (err) {
        console.error(err);
      }
    }

    return {
      status: '',
      runData: '',
      iframeKey: 0,
      iframeHeight: 100,
      formData
    };
  },
  mounted() {
    window.addEventListener('message', this.handleMessage);
  },
  beforeUnmount() {
    window.removeEventListener('message', this.handleMessage);
  },
  methods: {
    deleteTest(index: number): void {
      this.formData.tests.splice(index, 1);
    },
    newTestAfter(index: number): void {
      this.formData.tests.splice(index + 1, 0, { name: '', code: '' });
    },
    runTests(): void {
      this.formData.tests = this.formData.tests.filter(
        test => test.name || test.code
      );

      // @TODO add error handling
      if (!this.formData.tests.length) {
        this.formData.tests = [{ name: '', code: '' }];
        return;
      }

      this.status = 'running';
      this.runData = this.dataUrl;

      // So that we can run multiple times with same data
      this.iframeKey++;

      // @ts-ignore
      this.$router.push({ query: { testData: this.dataUrl } });
    },
    handleMessage(e: MessageEvent): void {
      const data = e.data;

      if (typeof data === 'string' && data.startsWith('new-height ')) {
        const height = data.slice(11);
        try {
          this.iframeHeight = Number(height);
        } catch (err) {
          console.error('Invalid number', err);
        }
      }
    }
  },
  computed: {
    dataUrl(): string {
      return JSON.stringify(this.formData);
    }
  }
};
</script>
