module {
  // Platform fee in basis points (10% = 1000 bps)
  public let PLATFORM_FEE_BASIS_POINTS : Nat = 1000;
  
  // Royalty amount credited to artist per stream (in token units)
  public let STREAM_ROYALTY_AMOUNT : Nat = 1;
  
  // Initial balance for new users (in token units)
  public let INITIAL_USER_BALANCE : Nat = 100;
  
  // Legacy aliases for backward compatibility
  public let FEE_BPS : Nat = PLATFORM_FEE_BASIS_POINTS;
  public let STREAM_ROYALTY : Nat = STREAM_ROYALTY_AMOUNT;
  public let INITIAL_BALANCE : Nat = INITIAL_USER_BALANCE;
}
