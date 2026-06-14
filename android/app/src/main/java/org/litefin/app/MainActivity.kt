package org.litefin.app

import android.annotation.SuppressLint
import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import org.json.JSONObject

class MainActivity : Activity() {
    private lateinit var root: FrameLayout
    private lateinit var webView: WebView
    private lateinit var playerView: PlayerView
    private lateinit var player: ExoPlayer

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        root = FrameLayout(this)
        player = ExoPlayer.Builder(this).build()
        playerView = PlayerView(this).apply {
            useController = false
            this.player = this@MainActivity.player
            visibility = View.GONE
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        webView = WebView(this).apply {
            setBackgroundColor(android.graphics.Color.TRANSPARENT)
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            addJavascriptInterface(AndroidPlayerBridge(), "LitefinAndroidPlayer")
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            loadUrl("file:///android_asset/index.html")
        }

        root.addView(playerView)
        root.addView(webView)
        setContentView(root)

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                when (playbackState) {
                    Player.STATE_BUFFERING -> emit("waiting")
                    Player.STATE_READY -> emit("playing", JSONObject().put("duration", player.duration.coerceAtLeast(0) / 1000.0))
                    Player.STATE_ENDED -> emit("ended")
                }
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                emit(if (isPlaying) "play" else "pause")
            }

            override fun onPlayerError(error: PlaybackException) {
                emit("error", JSONObject().put("message", error.message ?: "Media3 playback error"))
            }
        })
    }

    override fun onDestroy() {
        player.release()
        webView.destroy()
        super.onDestroy()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        webView.dispatchKeyEvent(event)
        return super.dispatchKeyEvent(event)
    }

    private fun emit(type: String, data: JSONObject = JSONObject()) {
        val payload = JSONObject().put("type", type).put("data", data).toString()
        webView.post { webView.evaluateJavascript("window.__litefinAndroidPlayerEvent && window.__litefinAndroidPlayerEvent($payload);", null) }
    }

    inner class AndroidPlayerBridge {
        @JavascriptInterface fun play(json: String) = runOnUiThread {
            val options = JSONObject(json)
            val url = options.getString("url")
            player.setMediaItem(MediaItem.fromUri(Uri.parse(url)))
            player.prepare()
            if (options.optDouble("startPosition", 0.0) > 0.0) {
                player.seekTo((options.optDouble("startPosition") * 1000).toLong())
            }
            player.play()
            playerView.visibility = View.VISIBLE
        }

        @JavascriptInterface fun pause() = runOnUiThread { player.pause() }
        @JavascriptInterface fun unpause() = runOnUiThread { player.play() }
        @JavascriptInterface fun stop() = runOnUiThread { player.stop(); playerView.visibility = View.GONE }
        @JavascriptInterface fun seek(seconds: Double) = runOnUiThread { player.seekTo((seconds * 1000).toLong()) }
        @JavascriptInterface fun setVolume(volume: Double) = runOnUiThread { player.volume = volume.toFloat().coerceIn(0f, 1f) }
        @JavascriptInterface fun setSpeed(speed: Double) = runOnUiThread { player.playbackParameters = PlaybackParameters(speed.toFloat()) }
        @JavascriptInterface fun getCurrentTime(): Double = player.currentPosition / 1000.0
        @JavascriptInterface fun getDuration(): Double = if (player.duration > 0) player.duration / 1000.0 else 0.0
        @JavascriptInterface fun isPaused(): Boolean = !player.isPlaying
        @JavascriptInterface fun isAvailable(): Boolean = true
    }
}
