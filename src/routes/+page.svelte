<script>
  import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
  <div>
    <Navbar />
  </div>

  <!-- Hero Section -->
  <section class="flex flex-col md:flex-row items-center justify-between px-8 py-16">
    <div class="max-w-xl">
      <h1 class="text-5xl md:text-6xl font-extrabold mb-6 text-orange-400 drop-shadow-lg">
        Stream Your Favorite Anime <span class="text-white">on ARMS</span>
      </h1>
      <p class="text-lg md:text-xl mb-8 text-gray-300">
        Discover, watch, and enjoy the latest and greatest anime series, all in one place. Join ARMS and start your anime adventure today!
      </p>
      <a href="/home" class="inline-block px-8 py-3 bg-orange-400 text-gray-900 font-bold rounded shadow hover:bg-orange-300 transition">
        Start Watching
      </a>
    </div>
    <div class="mt-10 md:mt-0 md:ml-12">
      <img src="https://static.crunchyroll.com/fms/landscape_large/65/png/7e9e7e3e-2e6a-4b2b-8e8b-7e9e7e3e2e6a.png" alt="Featured Anime" class="rounded-lg shadow-2xl w-full max-w-md" />
    </div>
  </section>
</div>
