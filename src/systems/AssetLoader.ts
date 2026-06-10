import Phaser from "phaser";
import { imageAssetList, soundAssetList } from "../assets/AssetManifest";

export class AssetLoader {
  static preload(scene: Phaser.Scene): void {
    scene.load.on("loaderror", (file: Phaser.Loader.File) => {
      // Missing placeholder assets should never stop the game; fallback drawings remain active.
      console.warn(`Asset failed to load: ${file.key}`);
    });

    for (const asset of imageAssetList) {
      scene.load.image(asset.key, asset.path);
    }

    for (const asset of soundAssetList) {
      scene.load.audio(asset.key, asset.path);
    }
  }

  static hasTexture(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }
}
