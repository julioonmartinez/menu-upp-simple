<!-- src/components/SimpleTopRatedTest.svelte -->
<script lang="ts">
  // Componente simplificado para probar solo el endpoint de top-rated dishes
  
  let loading = $state(false);
  let results = $state<any[]>([]);
  let error = $state<string | null>(null);
  let debugInfo = $state<any>(null);

  // Función simplificada sin usar stores
  async function testTopRatedDishes() {
    loading = true;
    error = null;
    results = [];
    debugInfo = null;

    try {
      const baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';
      const url = `${baseUrl}/dishes/top-rated?limit=12&min_ratings=3`;
      
      console.log('🔍 Testing URL:', url);
      
      debugInfo = {
        url,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Success data:', data);
      
      results = Array.isArray(data) ? data : [];
      
      debugInfo = {
        ...debugInfo,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        dataType: typeof data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null
      };

    } catch (err) {
      console.error('❌ Test error:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      
      debugInfo = {
        ...debugInfo,
        error: error,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name
      };
    } finally {
      loading = false;
    }
  }

  // Función para probar con diferentes parámetros
  async function testWithParams(limit: number, minRatings: number) {
    loading = true;
    error = null;
    results = [];

    try {
      const baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';
      const url = `${baseUrl}/dishes/top-rated?limit=${limit}&min_ratings=${minRatings}`;
      
      console.log(`🔍 Testing with params - limit: ${limit}, min_ratings: ${minRatings}`);
      console.log('🔍 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      results = Array.isArray(data) ? data : [];
      
      console.log(`✅ Success with params - got ${results.length} results`);

    } catch (err) {
      console.error('❌ Test with params error:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Auto-test al cargar
  import { onMount } from 'svelte';
  onMount(() => {
    console.log('🚀 Auto-testing on mount...');
    testTopRatedDishes();
  });
</script>

<div class="test-container">
  <h1>🧪 Test Top Rated Dishes Endpoint</h1>
  
  <div class="controls">
    <button onclick={testTopRatedDishes} disabled={loading}>
      {loading ? '⏳ Testing...' : '🔄 Test Basic (limit=12, min_ratings=3)'}
    </button>
    
    <button onclick={() => testWithParams(5, 1)} disabled={loading}>
      🔄 Test Easy (limit=5, min_ratings=1)
    </button>
    
    <button onclick={() => testWithParams(10, 2)} disabled={loading}>
      🔄 Test Medium (limit=10, min_ratings=2)
    </button>
  </div>

  {#if error}
    <div class="error">
      <h3>❌ Error</h3>
      <pre>{error}</pre>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <p>⏳ Loading...</p>
    </div>
  {/if}

  {#if results.length > 0}
    <div class="results">
      <h3>✅ Results ({results.length} dishes)</h3>
      <div class="dishes-list">
        {#each results as dish}
          <div class="dish-item">
            <h4>{dish.name || 'Unnamed dish'}</h4>
            <p>ID: {dish.id}</p>
            <p>Rating: {dish.rating}</p>
            <p>Position: {dish.position}</p>
            <p>Total Ratings: {dish.total_ratings || dish.totalRatings || 'N/A'}</p>
            <p>Price: ${dish.price}</p>
            {#if dish.image}
              <img src={dish.image} alt={dish.name} style="width: 100px; height: 100px; object-fit: cover;" />
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if debugInfo}
    <details class="debug-info">
      <summary>🔍 Debug Info</summary>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </details>
  {/if}
</div>

<style>
  .test-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .controls button {
    padding: 10px 15px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

  .controls button:hover:not(:disabled) {
    background: #0056b3;
  }

  .controls button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .error {
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .error pre {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #6c757d;
  }

  .results {
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .dishes-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .dish-item {
    border: 1px solid #e9ecef;
    border-radius: 5px;
    padding: 10px;
    background: #f8f9fa;
  }

  .dish-item h4 {
    margin: 0 0 10px 0;
    color: #495057;
  }

  .dish-item p {
    margin: 5px 0;
    font-size: 12px;
    color: #6c757d;
  }

  .debug-info {
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 10px;
    background: #f8f9fa;
  }

  .debug-info pre {
    background: #ffffff;
    padding: 10px;
    border-radius: 3px;
    overflow-x: auto;
    font-size: 12px;
    white-space: pre-wrap;
  }

  .debug-info summary {
    cursor: pointer;
    font-weight: bold;
    padding: 5px 0;
  }
</style>